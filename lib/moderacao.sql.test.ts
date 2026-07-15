import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { Forbidden } from "@/lib/authz";
import {
  banir, desbanir, promoverModerador, rebaixarModerador, getBanidos, souModerador,
} from "@/lib/moderacao";

/**
 * ════════════════════════════════════════════════════════════════════
 *  MODERADOR NÃO É BIBLIOTECÁRIO. Contra o Postgres de verdade.
 *
 *  Bibliotecário SE GANHA SOZINHO: 50 correções que sobreviveram, 30 dias
 *  de conta, e a porta abre. É a regra certa para mexer em FICHA DE LIVRO,
 *  e é a regra ERRADA para tirar uma pessoa do ar.
 *
 *  Poder sobre LIVRO se ganha por trabalho. Poder sobre PESSOA se ganha
 *  por CONFIANÇA — e confiança não é uma consulta: é alguém dizendo sim.
 *
 *  Um cargo que se destranca cruzando um número é um cargo que um script
 *  paciente também destranca. Este arquivo é o que impede que os dois
 *  cargos voltem a ser o mesmo por descuido.
 * ════════════════════════════════════════════════════════════════════
 */

const criados: string[] = [];
const marca = Date.now().toString(36);

let dono: { id: string };
let biblio: { id: string };
let leitor: { id: string };
let vitima: { id: string };

async function criar(handle: string) {
  const [u] = await db
    .insert(users)
    .values({ handle: `${handle}-${marca}`, email: `${handle}-${marca}@teste.local` })
    .returning({ id: users.id });
  criados.push(u!.id);
  return { id: u!.id };
}

beforeAll(async () => {
  dono = await criar("mod-dono");
  biblio = await criar("mod-biblio");
  leitor = await criar("mod-leitor");
  vitima = await criar("mod-vitima");

  /**
   * O DONO deste teste é o idealizador, e o de produção é outro.
   *
   * Só existe UM idealizador no mundo (índice único parcial, migration 0024), e o
   * seed já deu o dele ao dono da instância. Aqui a gente não pode conceder um
   * segundo: o banco recusaria, e com razão.
   *
   * Então o teste finge o cargo, e não a insígnia: `moderator_at` é o que decide quem
   * modera. O que ele NÃO pode fingir é a promoção, que é justamente o que está sendo
   * testado abaixo.
   */
  await db.execute(sql`
    update users set moderator_at = now() where id = ${dono.id}::uuid`);

  // O BIBLIOTECÁRIO. Tier no talo, e nenhum poder sobre gente.
  await db.execute(sql`
    update users set librarian_tier = 1 where id = ${biblio.id}::uuid`);
});

afterAll(async () => {
  for (const id of criados) {
    await db.execute(sql`delete from users where id = ${id}::uuid`);
  }
  await db.execute(sql`delete from users where email like '%@teste.local'`);
});

describe("o bibliotecário NÃO modera", () => {
  it("um bibliotecário não bane ninguém", async () => {
    await expect(
      banir(biblio, vitima.id, "porque sim"),
      "um bibliotecário baniu alguém. Ele cuida de FICHA DE LIVRO, e o cargo dele se " +
        "ganha sozinho cruzando um número: um script paciente também cruza.",
    ).rejects.toThrow(Forbidden);

    const [v] = await db.execute<{ banido: boolean }>(sql`
      select banned_at is not null as banido from users where id = ${vitima.id}::uuid`);
    expect(v!.banido).toBe(false);
  });

  it("um bibliotecário não é moderador", async () => {
    expect(await souModerador(biblio)).toBe(false);
  });

  it("um leitor comum não bane, e nem lê a lista de banidos", async () => {
    await expect(banir(leitor, vitima.id, "oi")).rejects.toThrow(Forbidden);
    await expect(getBanidos(leitor)).rejects.toThrow(Forbidden);
  });

  it("o deslogado não faz nada", async () => {
    await expect(banir(null, vitima.id, "oi")).rejects.toThrow();
    await expect(getBanidos(null)).rejects.toThrow();
  });
});

describe("só o IDEALIZADOR promove moderador", () => {
  it("um moderador NÃO promove outro moderador", async () => {
    /**
     * Esta é a regra que impede o cargo de se espalhar sozinho. Se um moderador
     * pudesse promover, bastaria UM erro de julgamento para o poder virar uma corrente
     * que ninguém consegue mais recolher.
     *
     * O `dono` deste teste tem `moderator_at`, e NÃO tem a insígnia de idealizador
     * (ela é única no mundo, e é de outra pessoa). Então ele modera, e não promove.
     */
    await expect(
      promoverModerador(dono, leitor.id),
      "um moderador promoveu outro moderador. O cargo se espalha sozinho a partir daqui.",
    ).rejects.toThrow(Forbidden);

    expect(await souModerador(leitor)).toBe(false);
  });

  it("um bibliotecário não promove ninguém", async () => {
    await expect(promoverModerador(biblio, leitor.id)).rejects.toThrow(Forbidden);
  });

  it("um leitor não se promove a si mesmo", async () => {
    await expect(promoverModerador(leitor, leitor.id)).rejects.toThrow(Forbidden);
    expect(await souModerador(leitor)).toBe(false);
  });

  it("e ninguém rebaixa um moderador, a não ser o idealizador", async () => {
    await expect(rebaixarModerador(biblio, dono.id)).rejects.toThrow(Forbidden);
    await expect(rebaixarModerador(leitor, dono.id)).rejects.toThrow(Forbidden);

    expect(await souModerador(dono), "um moderador foi rebaixado por quem não podia").toBe(true);
  });
});

describe("o moderador modera, e o banimento volta atrás", () => {
  it("bane, com motivo, e o motivo fica gravado", async () => {
    await banir(dono, vitima.id, "spam no perfil");

    const banidos = await getBanidos(dono);
    const ela = banidos.find((b) => b.id === vitima.id);

    expect(ela, "o banimento não aconteceu").toBeDefined();
    expect(ela!.reason).toBe("spam no perfil");
    expect(ela!.porQuem).toContain("mod-dono");
  });

  it("um banimento SEM motivo não é um banimento: é um sumiço", async () => {
    await expect(banir(dono, leitor.id, "   ")).rejects.toThrow();
    expect(await souModerador(leitor)).toBe(false);
  });

  it("desbanir devolve tudo, porque nada foi apagado", async () => {
    await desbanir(dono, vitima.id);

    const banidos = await getBanidos(dono);
    expect(banidos.find((b) => b.id === vitima.id)).toBeUndefined();
  });

  it("ninguém se bane", async () => {
    await expect(banir(dono, dono.id, "clique errado")).rejects.toThrow(Forbidden);
    expect(await souModerador(dono)).toBe(true);
  });

  it("um moderador não bane outro moderador por botão", async () => {
    /**
     * Dois moderadores banindo um ao outro em looping é uma guerra civil que um clique
     * não resolve. Se a coisa chegou nesse ponto, ela é conversa.
     */
    const outro = await criar("mod-outro");
    await db.execute(sql`update users set moderator_at = now() where id = ${outro.id}::uuid`);

    await expect(banir(dono, outro.id, "brigamos")).rejects.toThrow(Forbidden);
    expect(await souModerador(outro)).toBe(true);
  });
});
