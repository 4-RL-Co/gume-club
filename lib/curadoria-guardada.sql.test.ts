import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  guardarCuradoria, esquecerCuradoria, jaGuardei, getCuradoriasGuardadas, CURADORIAS,
} from "@/lib/curadoria-guardada";

/**
 * ════════════════════════════════════════════════════════════════════
 *  GUARDAR A CURADORIA DA CASA, E NUNCA GUARDAR UMA CHAVE INVENTADA.
 *
 *  ═══ A TABELA NÃO TEM CHAVE ESTRANGEIRA, E ESSE É O RISCO ═══
 *
 *  A curadoria da casa não é uma coleção: o Top 100 é calculado a cada visita, sem
 *  linha em tabela nenhuma. Então `curation_saves.chave` é um texto solto — o banco
 *  aceitaria `'qualquer-coisa'` e não teria como recusar.
 *
 *  Uma linha órfã não é um erro abstrato: é um item guardado que aparece no perfil de
 *  alguém e não leva a lugar nenhum. A pessoa clica e não acontece nada.
 *
 *  Por isso a validação tem DUAS pontas, e este arquivo aperta as duas: a escrita
 *  recusa a chave desconhecida, e a LEITURA filtra o que não reconhece. A segunda
 *  existe porque o dado sobrevive ao código: uma lista editorial aposentada amanhã
 *  deixa linhas para trás, e elas não podem virar card quebrado.
 *
 *  Precisa de banco. O CI sobe um.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
let leitorId: string;
const CHAVE = CURADORIAS[0]!.chave;

beforeAll(async () => {
  const [u] = await db
    .insert(users)
    .values({ handle: `cur-${marca}`, email: `cur-${marca}@cur.test` })
    .returning({ id: users.id });
  leitorId = u!.id;
});

afterAll(async () => {
  await db.execute(sql`delete from users where id = ${leitorId}::uuid`);
});

describe("guardar a curadoria da casa", () => {
  it("guardar e esquecer, e a tela sabe qual botão mostrar", async () => {
    const viewer = { id: leitorId };

    expect(await jaGuardei(viewer, CHAVE), "nasceu guardada").toBe(false);

    await guardarCuradoria(viewer, CHAVE);
    expect(await jaGuardei(viewer, CHAVE), "guardar não guardou").toBe(true);

    // Guardar de novo não pode explodir: dois cliques rápidos são uma coisa comum.
    await guardarCuradoria(viewer, CHAVE);
    expect((await getCuradoriasGuardadas(leitorId)).length, "guardou duas vezes").toBe(1);

    await esquecerCuradoria(viewer, CHAVE);
    expect(await jaGuardei(viewer, CHAVE), "esquecer não esqueceu").toBe(false);
  });

  /**
   * A ação de servidor recebe o que o CLIENTE mandar, e não o que a tela desenhou.
   */
  it("chave inventada não grava nada", async () => {
    const viewer = { id: leitorId };
    await guardarCuradoria(viewer, "lista-que-nao-existe");

    const [row] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from curation_saves where user_id = ${leitorId}::uuid`);
    expect(
      row?.n,
      "uma chave inventada foi gravada: ela vira um item no perfil de alguém que não " +
        "leva a lugar nenhum, e o banco não tem como recusar por conta própria.",
    ).toBe(0);
  });

  /**
   * A OUTRA ponta: linha que já está no banco e o app não reconhece mais.
   * Escrita direto no banco de propósito — é assim que ela existiria no mundo real,
   * deixada para trás por uma lista editorial aposentada.
   */
  it("linha que o app não reconhece mais não vira card quebrado", async () => {
    await db.execute(sql`
      insert into curation_saves (user_id, chave) values (${leitorId}::uuid, 'lista-aposentada')`);

    const guardadas = await getCuradoriasGuardadas(leitorId);
    expect(
      guardadas.some((c) => c.chave === "lista-aposentada"),
      "uma lista aposentada voltou para a tela: o perfil mostra um item que não abre.",
    ).toBe(false);

    // E a linha CONTINUA no banco: o dado é da pessoa, e apagar em silêncio seria pior.
    const [row] = await db.execute<{ n: number }>(sql`
      select count(*)::int as n from curation_saves
       where user_id = ${leitorId}::uuid and chave = 'lista-aposentada'`);
    expect(row?.n, "a linha foi apagada em silêncio").toBe(1);
  });
});
