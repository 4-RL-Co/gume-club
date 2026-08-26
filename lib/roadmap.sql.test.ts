import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, roadmapItems } from "@/lib/db/schema";
import { Forbidden, souIdealizador } from "@/lib/authz";
import {
  getRoadmapAberto, getChangelog, votosRestantes, votar, tirarVoto,
  getTodosOsItens, criarItem, editarItem, mudarStatus, reordenarItens, apagarItem,
} from "@/lib/roadmap";

/**
 * ════════════════════════════════════════════════════════════════════
 *  RED TEAM: "O QUE VEM POR AÍ". Três votos por ano, e só o dono mexe na lista.
 *
 *  Duas famílias de prova:
 *
 *   1. O VOTO. O teto de 3 por ano é real (não confiado em nenhuma tela), realocar
 *      (tirar de um item, pôr em outro) não custa uma vaga extra, votar de novo no
 *      mesmo item no mesmo ano não duplica nem falha, e um item "lancado" não aceita
 *      voto novo.
 *
 *   2. A ADMINISTRAÇÃO. `assertIdealizador` recusa um usuário comum de verdade (não só
 *      a tela esconde o botão) em toda mutação. O idealizador é ÚNICO no mundo (migration
 *      0024): o caminho feliz reusa o que já existe no banco, em leitura, e se abstém
 *      num banco novo — mesmo padrão de lib/painel.redteam.sql.test.ts.
 * ════════════════════════════════════════════════════════════════════
 */

let leitor: { id: string };
let comum: { id: string };
const itensCriados: string[] = [];
const usuariosCriados: string[] = [];
const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

async function novoItem(status: "ideia" | "planejado" | "em_andamento" | "lancado" = "ideia") {
  const [i] = await db.insert(roadmapItems)
    .values({ title: `zz item ${marca} ${itensCriados.length}`, status })
    .returning({ id: roadmapItems.id });
  itensCriados.push(i!.id);
  return i!.id;
}

beforeAll(async () => {
  const mk = async (handle: string) => {
    const [u] = await db.insert(users)
      .values({ handle, email: `${handle}@roadmap.test` })
      .returning({ id: users.id });
    usuariosCriados.push(u!.id);
    return { id: u!.id };
  };
  leitor = await mk(`roadmap-leitor-${marca}`);
  comum = await mk(`roadmap-comum-${marca}`);
});

afterAll(async () => {
  for (const id of itensCriados) await db.execute(sql`delete from roadmap_items where id = ${id}::uuid`);
  for (const id of usuariosCriados) await db.execute(sql`delete from users where id = ${id}::uuid`);
});

describe("o voto: três por ano, um por item", () => {
  it("vota, e o item aparece com um voto a mais", async () => {
    const item = await novoItem();
    const r = await votar(leitor, item);
    expect(r.ok).toBe(true);

    const aberto = await getRoadmapAberto(leitor);
    const achado = aberto.ideia.find((i) => i.id === item);
    expect(achado?.votos).toBe(1);
    expect(achado?.viewerVotou).toBe(true);
  });

  it("votar de novo no mesmo item no mesmo ano não duplica, nem falha", async () => {
    const item = await novoItem();
    await votar(leitor, item);
    const r = await votar(leitor, item);
    expect(r.ok).toBe(true);

    const [row] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from roadmap_votes where user_id = ${leitor.id}::uuid and item_id = ${item}::uuid`);
    expect(row?.n).toBe(1);
  });

  it("o quarto item é recusado: o teto é três", async () => {
    // Um leitor NOVO, pra não herdar votos dos testes acima.
    const [u] = await db.insert(users)
      .values({ handle: `roadmap-teto-${marca}`, email: `roadmap-teto-${marca}@roadmap.test` })
      .returning({ id: users.id });
    usuariosCriados.push(u!.id);
    const alguem = { id: u!.id };

    const [a, b, c, d] = await Promise.all([novoItem(), novoItem(), novoItem(), novoItem()]);
    expect((await votar(alguem, a)).ok).toBe(true);
    expect((await votar(alguem, b)).ok).toBe(true);
    expect((await votar(alguem, c)).ok).toBe(true);

    const recusa = await votar(alguem, d);
    expect(recusa.ok, "deixou passar o quarto voto do ano").toBe(false);
    expect(await votosRestantes(alguem)).toBe(0);
  });

  it("realocar (tirar de um item, votar em outro) não custa uma vaga extra", async () => {
    const [u] = await db.insert(users)
      .values({ handle: `roadmap-realoca-${marca}`, email: `roadmap-realoca-${marca}@roadmap.test` })
      .returning({ id: users.id });
    usuariosCriados.push(u!.id);
    const alguem = { id: u!.id };

    const [a, b, c, d] = await Promise.all([novoItem(), novoItem(), novoItem(), novoItem()]);
    await votar(alguem, a);
    await votar(alguem, b);
    await votar(alguem, c);
    expect(await votosRestantes(alguem)).toBe(0);

    await tirarVoto(alguem, a);
    expect(await votosRestantes(alguem)).toBe(1);

    const r = await votar(alguem, d);
    expect(r.ok, "a vaga liberada por tirarVoto não voltou a valer").toBe(true);
    expect(await votosRestantes(alguem)).toBe(0);
  });

  it("um item lançado não aceita voto novo", async () => {
    const item = await novoItem("lancado");
    const r = await votar(leitor, item);
    expect(r.ok, "deixou votar num item que já saiu do ar").toBe(false);
  });

  it("quem não votou tem os três disponíveis, e um visitante sem sessão tem zero", async () => {
    const [u] = await db.insert(users)
      .values({ handle: `roadmap-zero-${marca}`, email: `roadmap-zero-${marca}@roadmap.test` })
      .returning({ id: users.id });
    usuariosCriados.push(u!.id);
    expect(await votosRestantes({ id: u!.id })).toBe(3);
    expect(await votosRestantes(null)).toBe(0);
  });
});

describe("o changelog nunca mostra o que ainda não saiu", () => {
  it("getRoadmapAberto nunca inclui um item lançado", async () => {
    const item = await novoItem("lancado");
    const aberto = await getRoadmapAberto(null);
    for (const lista of Object.values(aberto)) {
      expect(lista.find((i) => i.id === item)).toBeUndefined();
    }
  });

  it("getChangelog só mostra o que já foi lançado", async () => {
    const item = await novoItem("planejado");
    let changelog = await getChangelog();
    expect(changelog.find((i) => i.id === item)).toBeUndefined();

    await db.execute(sql`
      update roadmap_items set status = 'lancado', lancado_em = now() where id = ${item}::uuid`);
    changelog = await getChangelog();
    expect(changelog.find((i) => i.id === item)).toBeDefined();
  });
});

describe("um usuário comum não administra o que vem por aí", () => {
  it("souIdealizador é false pra um usuário comum", async () => {
    expect(await souIdealizador(comum)).toBe(false);
  });

  it("criarItem recusa", async () => {
    await expect(
      criarItem(comum, { title: "x", description: "", status: "ideia" }),
    ).rejects.toBeInstanceOf(Forbidden);
  });

  it("editarItem, mudarStatus, reordenarItens e apagarItem recusam", async () => {
    const item = await novoItem();
    await expect(editarItem(comum, item, { title: "y", description: "" })).rejects.toBeInstanceOf(Forbidden);
    await expect(mudarStatus(comum, item, "planejado")).rejects.toBeInstanceOf(Forbidden);
    await expect(reordenarItens(comum, "ideia", [item])).rejects.toBeInstanceOf(Forbidden);
    await expect(apagarItem(comum, item)).rejects.toBeInstanceOf(Forbidden);
  });

  it("getTodosOsItens recusa, e um visitante sem sessão também", async () => {
    await expect(getTodosOsItens(comum)).rejects.toBeInstanceOf(Forbidden);
    await expect(getTodosOsItens(null)).rejects.toBeInstanceOf(Forbidden);
  });
});

describe("o idealizador administra de verdade", () => {
  it("cria, edita, muda status, reordena e apaga, sem erro de SQL", async () => {
    const [ideal] = await db.execute<{ user_id: string }>(sql`
      select user_id from badge_grants
       where badge = 'idealizador' and revoked_at is null
       limit 1`);

    if (!ideal) {
      // Banco sem idealizador: nada a provar sobre o caminho feliz aqui.
      expect(true).toBe(true);
      return;
    }
    const dono = { id: ideal.user_id };

    await criarItem(dono, { title: `zz criado ${marca}`, description: "uma ideia", status: "ideia" });
    const [criado] = await db.execute<{ id: string }>(sql`
      select id from roadmap_items where title = ${`zz criado ${marca}`} limit 1`);
    expect(criado).toBeDefined();
    itensCriados.push(criado!.id);

    await editarItem(dono, criado!.id, { title: `zz editado ${marca}`, description: "mudou" });
    const [item] = await db.execute<{ title: string }>(sql`
      select title from roadmap_items where id = ${criado!.id}::uuid`);
    expect(item?.title).toBe(`zz editado ${marca}`);

    await mudarStatus(dono, criado!.id, "lancado");
    let [status] = await db.execute<{ status: string; lancado_em: Date | null }>(sql`
      select status, lancado_em from roadmap_items where id = ${criado!.id}::uuid`);
    expect(status?.status).toBe("lancado");
    expect(status?.lancado_em, "a transição pra lançado não gravou a data").not.toBeNull();

    // Voltar pra "planejado" limpa lancado_em: não pode continuar num changelog que já negou.
    await mudarStatus(dono, criado!.id, "planejado");
    [status] = await db.execute<{ status: string; lancado_em: Date | null }>(sql`
      select status, lancado_em from roadmap_items where id = ${criado!.id}::uuid`);
    expect(status?.lancado_em, "voltar de lançado deveria limpar a data").toBeNull();

    const outro = await novoItem("planejado");
    await reordenarItens(dono, "planejado", [outro, criado!.id]);
    const [pos1, pos2] = await Promise.all([
      db.execute<{ position: number }>(sql`select position from roadmap_items where id = ${outro}::uuid`),
      db.execute<{ position: number }>(sql`select position from roadmap_items where id = ${criado!.id}::uuid`),
    ]);
    expect(pos1[0]?.position).toBe(0);
    expect(pos2[0]?.position).toBe(1);

    await apagarItem(dono, criado!.id);
    const [ainda] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from roadmap_items where id = ${criado!.id}::uuid`);
    expect(ainda?.n).toBe(0);
  });

  it("getTodosOsItens devolve todo status, inclusive lançado", async () => {
    const [ideal] = await db.execute<{ user_id: string }>(sql`
      select user_id from badge_grants
       where badge = 'idealizador' and revoked_at is null
       limit 1`);
    if (!ideal) {
      expect(true).toBe(true);
      return;
    }
    const item = await novoItem("lancado");
    const todos = await getTodosOsItens({ id: ideal.user_id });
    expect(todos.find((i) => i.id === item)).toBeDefined();
  });
});
