import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, works, ratings } from "@/lib/db/schema";
import { getQueridinhos } from "@/lib/queridinhos";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O TOP 100 CONTA O VEREDITO PRIVADO. E AS DUAS TELAS TÊM QUE CONCORDAR.
 *
 *  ═══ O BUG QUE ESTE ARQUIVO NASCE PARA IMPEDIR ═══
 *
 *  A lista contava só nota pública, e saía errada: a Saga de Njáll tinha dois
 *  "adorei", um deles privado, valia UM, e caía no desempate por título, atrás
 *  de livros com menos amor que ela. Quem viu não viu um bug: viu uma lista que
 *  parecia aleatória, que é como um ranking errado sempre se parece.
 *
 *  ═══ E A COROA TEM QUE BATER COM A LISTA ═══
 *
 *  A mesma conta existe em DOIS lugares: aqui e na página do livro
 *  (app/livro/[slug]/page.tsx), que desenha a coroa e a posição. São consultas
 *  de formatos diferentes (uma devolve a lista inteira, a outra um livro só com
 *  a posição), então não dá para ter uma função só sem piorar as duas.
 *
 *  O que dá é AMARRAR AS PONTAS: este teste lê o código da página e exige que a
 *  régua de visibilidade seja a mesma. No dia em que alguém "consertar" uma das
 *  duas, o build quebra em vez de o app passar a discordar de si mesmo em
 *  silêncio, que foi exatamente o que aconteceu aqui.
 *
 *  Precisa de banco. O CI sobe um.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const criados: string[] = [];
let obraAmada: string;
let obraMorna: string;

beforeAll(async () => {
  const mk = async (h: string) => {
    const [u] = await db
      .insert(users)
      .values({ handle: `${h}-${marca}`, email: `${h}-${marca}@quer.test` })
      .returning({ id: users.id });
    criados.push(u!.id);
    return u!.id;
  };

  const ana = await mk("quer-ana");
  const bruno = await mk("quer-bruno");

  // Um título que começa com "zz" para os dois: assim, se a contagem empatar, o
  // desempate por título os joga para o FIM da lista, e um teste que dependesse
  // da ordem alfabética falharia de forma óbvia em vez de passar por sorte.
  const [amada] = await db
    .insert(works)
    .values({ slug: `quer-amada-${marca}`, title: `zz amada ${marca}` })
    .returning({ id: works.id });
  const [morna] = await db
    .insert(works)
    .values({ slug: `quer-morna-${marca}`, title: `zz morna ${marca}` })
    .returning({ id: works.id });
  obraAmada = amada!.id;
  obraMorna = morna!.id;

  // A AMADA tem dois "adorei", e UM DELES É PRIVADO. É o caso da Saga de Njáll.
  await db.insert(ratings).values([
    { userId: ana, workId: obraAmada, value: 5, visibility: "public" },
    { userId: bruno, workId: obraAmada, value: 5, visibility: "private" },
    // A MORNA tem um só, público.
    { userId: ana, workId: obraMorna, value: 5, visibility: "public" },
  ]);
});

afterAll(async () => {
  for (const id of criados) await db.execute(sql`delete from users where id = ${id}::uuid`);
  await db.execute(sql`delete from works where slug like ${`quer-%${marca}`}`);
});

describe("o veredito privado conta no Top 100", () => {
  it("um livro com dois adorei, um deles privado, vale DOIS", async () => {
    const lista = await getQueridinhos(1000);
    const amada = lista.find((l) => l.slug === `quer-amada-${marca}`);

    expect(amada, "a obra amada sumiu do top").toBeTruthy();
    expect(
      amada!.adoraram,
      "o adorei privado não foi contado: é o bug da Saga de Njáll de volta",
    ).toBe(2);
  });

  it("e ele fica ACIMA de um livro com um adorei só", async () => {
    const lista = await getQueridinhos(1000);
    const pos = (slug: string) => lista.findIndex((l) => l.slug === slug);

    const amada = pos(`quer-amada-${marca}`);
    const morna = pos(`quer-morna-${marca}`);

    expect(amada).toBeGreaterThan(-1);
    expect(morna).toBeGreaterThan(-1);
    expect(
      amada < morna,
      "o livro com dois adorei ficou abaixo do com um. A ordenação está por título, " +
        "e não por amor: é exatamente o sintoma que o leitor relatou.",
    ).toBe(true);
  });

  /**
   * ═══ ESTANTE NÃO SEGUIU O VEREDITO ═══
   *
   * A linha da decisão: veredito conta sempre, estante só se for pública. Se
   * alguém tirar o filtro das contagens de estante junto, passa a contar quantas
   * pessoas têm o livro numa estante PRIVADA, e isso é outra coisa: estante é um
   * lugar que pertence a alguém, e não uma opinião sobre o livro.
   */
  it("as contagens de ESTANTE continuam só sobre o que é público", () => {
    const src = readFileSync("lib/queridinhos.ts", "utf8");

    // O parêntese faz parte da busca de propósito: sem ele, "as estantes" casa
    // com a PROSA de um comentário ("em quantas estantes mora"), o teste examina
    // o pedaço errado do arquivo e falha por um motivo que não é o dele.
    for (const trecho of [") as leram", ") as estantes"]) {
      const fim = src.indexOf(trecho);
      expect(fim, `não achei a contagem que termina em "${trecho}"`).toBeGreaterThan(-1);
      const consulta = src.slice(Math.max(0, fim - 700), fim);
      expect(
        /visibility = 'public'/.test(consulta),
        `a contagem de "${trecho}" perdeu o filtro de visibilidade. Veredito conta ` +
          "sempre; estante é um lugar de alguém, e só entra se for pública.",
      ).toBe(true);
    }
  });

  /**
   * ═══ E A PÁGINA DO LIVRO USA A MESMA RÉGUA ═══
   *
   * A coroa e a posição são calculadas lá, numa consulta de outro formato. Duas
   * réguas diferentes fazem o app discordar de si mesmo: a lista põe o livro em
   * quinto, a página dele diz outra coisa, e o leitor conclui que os números são
   * inventados.
   */
  it("a página do livro não voltou a filtrar veredito por visibilidade", () => {
    const src = readFileSync("app/livro/[slug]/page.tsx", "utf8");

    const cte = src.slice(src.indexOf("with publico as"), src.indexOf("group by r.work_id"));
    expect(
      /r\.visibility = 'public'/.test(cte),
      "a página do livro voltou a contar só adorei público. A coroa dela vai " +
        "discordar da lista de /queridinhos, e ninguém vai entender por quê.",
    ).toBe(false);

    const gostaram = src.slice(src.indexOf("and r.value >= 4"), src.indexOf("as gostaram"));
    expect(
      /r\.visibility = 'public'/.test(gostaram),
      "o 'gostaram' da página do livro voltou a filtrar por visibilidade, e o " +
        "'adoraram' não. Como gostaram inclui os adorei, a tela pode mostrar " +
        "3 adoraram ao lado de 2 gostaram, que é impossível.",
    ).toBe(false);
  });
});
