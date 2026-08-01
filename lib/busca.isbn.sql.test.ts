import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { works, editions, identifiers } from "@/lib/db/schema";
import { searchAll } from "@/lib/catalog";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O ISBN-10 TAMBÉM É UM ISBN. A BUSCA IGNORAVA 90 MIL DELES.
 *
 *  ═══ COMO ISTO APARECEU ═══
 *
 *  A fila de pedidos ("cada linha é alguém que procurou um livro e não achou") tinha
 *  33 entradas, e **treze delas eram livros que o acervo JÁ TEM**. Uma era um número
 *  de dez dígitos: `8543108055`.
 *
 *  A busca local comparava só com `editions.isbn13`. Quem digitasse o número de dez
 *  dígitos da contracapa não achava nada, o app respondia "não temos", e ainda
 *  registrava um pedido — a fila de "o que falta no acervo" enchia de livros que
 *  estão no acervo.
 *
 *  ═══ E A TABELA JÁ EXISTIA ═══
 *
 *  `identifiers` guarda todo nome externo que uma edição atende, e o comentário dela
 *  no schema já dizia por quê: "an ISBN is the only identifier a reader can hold in
 *  their hand". A IMPORTAÇÃO a consultava. A BUSCA, nunca. Em produção são 471.354
 *  linhas, 90.298 delas ISBN-10, sem uso nenhum.
 *
 *  Não faltava dado. Faltava perguntar.
 *
 *  Precisa de banco. O CI sobe um.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const ISBN13 = "9781234567897";
const ISBN10 = "1234567897";
let edicaoId: string;

beforeAll(async () => {
  const [w] = await db
    .insert(works)
    .values({ slug: `isbn-${marca}`, title: `zz isbn ${marca}` })
    .returning({ id: works.id });

  // A edição guarda o ISBN-13 na coluna; o ISBN-10 mora só em identifiers, que é
  // exatamente o caso que a busca não enxergava.
  const [e] = await db
    .insert(editions)
    .values({ workId: w!.id, isbn13: ISBN13, publisher: "Editora de Teste" })
    .returning({ id: editions.id });
  edicaoId = e!.id;

  await db.insert(identifiers).values([
    { editionId: edicaoId, kind: "isbn13", value: ISBN13 },
    { editionId: edicaoId, kind: "isbn10", value: ISBN10 },
  ]);
});

afterAll(async () => {
  await db.execute(sql`delete from works where slug = ${`isbn-${marca}`}`);
});

describe("a busca acha pelo ISBN que a pessoa tem na mão", () => {
  it("acha pelo ISBN-13, como sempre achou", async () => {
    const hits = await searchAll(ISBN13);
    expect(hits.some((h) => h.title.includes(marca)), "regressão: o ISBN-13 parou de achar").toBe(true);
  });

  /** O caso da fila de pedidos: dez dígitos, e o app dizia que não tinha. */
  it("acha pelo ISBN-10, que mora só na tabela de identificadores", async () => {
    const hits = await searchAll(ISBN10);
    expect(
      hits.some((h) => h.title.includes(marca)),
      "o ISBN-10 não acha nada. Quem digita o número da contracapa recebe 'não temos' " +
        "por um livro que está no acervo, e a fila de pedidos enche de falso alarme.",
    ).toBe(true);
  });

  /**
   * E com hífens, que é como o número está impresso no livro. `asIsbn` já normaliza,
   * e este teste existe para que continue: quem copia de uma loja cola com hífen.
   */
  it("acha com os hífens que vêm impressos", async () => {
    const hits = await searchAll("978-1-234-56789-7");
    expect(hits.some((h) => h.title.includes(marca)), "os hífens voltaram a atrapalhar").toBe(true);
  });

  it("um ISBN que não existe continua não existindo", async () => {
    const hits = await searchAll("9789999999999");
    expect(
      hits.some((h) => h.title.includes(marca)),
      "a busca por identificador ficou frouxa e casou com o livro errado",
    ).toBe(false);
  });
});
