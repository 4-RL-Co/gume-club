import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, collections, collectionItems } from "@/lib/db/schema";
import {
  getListasDe, getListasGuardadas, guardarLista, esquecerLista, jaGuardei,
  moverNaLista, numerarLista, descreverLista, getListasParaExplorar,
} from "@/lib/listas";

/**
 * ════════════════════════════════════════════════════════════════════
 *  RED TEAM: A ESTANTE MONTADA, GUARDADA E ORDENADA. Contra Postgres de verdade.
 *
 *  Três promessas moram aqui:
 *
 *  1. VISIBILIDADE. Guardar uma estante privada de outra pessoa não guarda nada
 *     (o insert carrega o filtro dentro), e uma estante que ficou privada DEPOIS
 *     some da tela de quem guardou.
 *
 *  2. DONO. Só quem montou reordena, numera e descreve. O atacante que troca o
 *     UUID não mexe em nada, e nada é dito.
 *
 *  3. SEM CONTADOR. Guardar nunca vira número: nenhuma consulta conta
 *     collection_saves, e o card não carrega campo de contagem. Endosso contado é
 *     curtida com outro nome, e é a linha que o README não cruza.
 * ════════════════════════════════════════════════════════════════════
 */

let atacante: { id: string };
let vitima: { id: string };
let obraA: string;
let obraB: string;
let listaPublica: string;
let listaPrivada: string;

const criados: string[] = [];
const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

beforeAll(async () => {
  const mk = async (handle: string) => {
    const [u] = await db
      .insert(users)
      .values({ handle, email: `${handle}@listas.test`, emailVerified: true })
      .returning({ id: users.id });
    criados.push(u!.id);
    return { id: u!.id };
  };

  atacante = await mk(`listas-atacante-${marca}`);
  vitima = await mk(`listas-vitima-${marca}`);

  const [wa] = await db
    .insert(works)
    .values({ slug: `listas-a-${marca}`, title: `O primeiro da lista ${marca}` })
    .returning({ id: works.id });
  const [wb] = await db
    .insert(works)
    .values({ slug: `listas-b-${marca}`, title: `O segundo da lista ${marca}` })
    .returning({ id: works.id });
  obraA = wa!.id;
  obraB = wb!.id;

  const [pub] = await db
    .insert(collections)
    .values({ userId: vitima.id, slug: `boas-${marca}`, name: "As boas", visibility: "public" })
    .returning({ id: collections.id });
  const [priv] = await db
    .insert(collections)
    .values({ userId: vitima.id, slug: `secretas-${marca}`, name: "As secretas", visibility: "private" })
    .returning({ id: collections.id });
  listaPublica = pub!.id;
  listaPrivada = priv!.id;

  await db.insert(collectionItems).values([
    { collectionId: listaPublica, workId: obraA, position: 1 },
    { collectionId: listaPublica, workId: obraB, position: 2 },
    { collectionId: listaPrivada, workId: obraA, position: 1 },
  ]);
});

afterAll(async () => {
  for (const id of criados) await db.execute(sql`delete from users where id = ${id}::uuid`);
  await db.execute(sql`delete from works where id = any(${sql.param([obraA, obraB])}::uuid[])`);
});

// ─────────────────────────────────────────────── visibilidade: o que se guarda

describe("guardar respeita a visibilidade, no SQL", () => {
  it("guardar a estante PÚBLICA de outra pessoa funciona, e aparece no perfil de quem guardou", async () => {
    await guardarLista(atacante, listaPublica);
    expect(await jaGuardei(atacante, listaPublica)).toBe(true);

    const guardadas = await getListasGuardadas(null, atacante.id);
    expect(guardadas.map((l) => l.id)).toContain(listaPublica);
    // O crédito é de quem montou, pelo nome.
    expect(guardadas[0]!.dono.handle).toBe(`listas-vitima-${marca}`);
  });

  it("guardar a estante PRIVADA de outra pessoa não guarda nada, e nada é dito", async () => {
    await guardarLista(atacante, listaPrivada);
    expect(await jaGuardei(atacante, listaPrivada)).toBe(false);
  });

  it("uma estante que ficou privada DEPOIS de guardada some da tela de quem guardou", async () => {
    await db.execute(sql`
      update collections set visibility = 'private' where id = ${listaPublica}::uuid`);

    const guardadas = await getListasGuardadas(null, atacante.id);
    expect(
      guardadas.map((l) => l.id),
      "a estante privada continuou na tela de quem guardou: o vínculo venceu a visibilidade",
    ).not.toContain(listaPublica);

    // De volta ao público para os próximos testes.
    await db.execute(sql`
      update collections set visibility = 'public' where id = ${listaPublica}::uuid`);
  });

  it("um estranho vê só as estantes públicas de alguém; o dono vê todas", async () => {
    const deFora = await getListasDe(atacante, vitima.id);
    expect(deFora.map((l) => l.id)).toContain(listaPublica);
    expect(deFora.map((l) => l.id)).not.toContain(listaPrivada);

    const deDentro = await getListasDe(vitima, vitima.id);
    expect(deDentro.map((l) => l.id)).toContain(listaPrivada);
  });

  it("esquecer apaga o gesto, e só o gesto", async () => {
    await esquecerLista(atacante, listaPublica);
    expect(await jaGuardei(atacante, listaPublica)).toBe(false);
  });
});

// ─────────────────────────────────────────────── dono: quem mexe na ordem

describe("IDOR: o atacante tenta mexer na estante da vítima", () => {
  it("não reordena a estante de outra pessoa", async () => {
    await moverNaLista(atacante, listaPublica, obraB, "subir");

    const [primeiro] = await db.execute<{ work_id: string }>(sql`
      select work_id from collection_items
       where collection_id = ${listaPublica}::uuid
       order by position asc limit 1`);
    expect(primeiro!.work_id, "o atacante reordenou a lista da vítima").toBe(obraA);
  });

  it("não numera nem descreve a estante de outra pessoa", async () => {
    await numerarLista(atacante, listaPublica, true);
    await descreverLista(atacante, listaPublica, "vandalismo");

    const [l] = await db.execute<{ ranked: boolean; description: string | null }>(sql`
      select ranked, description from collections where id = ${listaPublica}::uuid`);
    expect(l!.ranked).toBe(false);
    expect(l!.description).toBeNull();
  });

  it("e o dono reordena a própria: o segundo sobe para primeiro", async () => {
    await moverNaLista(vitima, listaPublica, obraB, "subir");

    const [primeiro] = await db.execute<{ work_id: string }>(sql`
      select work_id from collection_items
       where collection_id = ${listaPublica}::uuid
       order by position asc limit 1`);
    expect(primeiro!.work_id).toBe(obraB);
  });
});

// ─────────────────────────────────────────────── sem contador, por construção

describe("guardar nunca vira número", () => {
  /**
   * A trava estrutural: nenhuma consulta deste módulo conta collection_saves. O card
   * conta LIVROS (collection_items), e isso fica; contar GESTOS de gente é o contador
   * de curtida que o README promete não ter. Se um dia alguém escrever um
   * count sobre collection_saves, este teste quebra o build e aponta a linha certa
   * do porquê.
   */
  it("nenhuma consulta de lib/listas.ts conta collection_saves", () => {
    const src = readFileSync("lib/listas.ts", "utf8");
    for (const bloco of src.split(/\bsql`/).slice(1)) {
      const consulta = bloco.split("`")[0] ?? "";
      if (!/collection_saves/.test(consulta)) continue;
      expect(
        /count\s*\(/i.test(consulta),
        "uma consulta CONTA collection_saves. Guardar é endosso, e endosso contado é curtida com outro nome.",
      ).toBe(false);
    }
  });

  it("o card não carrega campo de contagem de gente", async () => {
    const listas = await getListasDe(vitima, vitima.id);
    expect(listas.length).toBeGreaterThan(0);
    for (const l of listas) {
      expect(Object.keys(l).sort()).toEqual(
        ["capas", "description", "dono", "id", "livros", "name", "ranked", "slug"],
      );
    }
  });

  it("o explorar devolve estantes com capas e dono, sem nada de popularidade", async () => {
    // A da vítima tem só 2 livros e o corte é 3: pode não aparecer, e não faz mal.
    // O que este teste garante é o FORMATO do que sai, seja de quem for.
    const listas = await getListasParaExplorar(null, 6);
    for (const l of listas) {
      expect(Object.keys(l).sort()).toEqual(
        ["capas", "description", "dono", "id", "livros", "name", "ranked", "slug"],
      );
    }
  });
});
