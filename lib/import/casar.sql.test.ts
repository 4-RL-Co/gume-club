import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { procurarNoCatalogo, ehFato } from "@/lib/import/casar";
import { findOrCreateWork } from "@/lib/library";
import type { LivroImportado } from "@/lib/import/tipos";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O CASAMENTO. É o jogo inteiro do importador.
 *
 *  ═══ O BUG QUE ESTE TESTE EXISTE POR CAUSA DE ═══
 *
 *  A cascata de casamento olhava o ISBN-13, a chave da Open Library, e o título. E NUNCA o
 *  ISBN-10 — que era gravado em `identifiers` no cadastro, e nunca lido de volta.
 *
 *  **Livro brasileiro publicado antes de 2007 só tem ISBN-10.** O ISBN-13 nem existia. E o
 *  export do Goodreads traz as duas colunas, separadas.
 *
 *  Ou seja: metade da estante de quem compra em sebo — que é o leitor que este app existe
 *  para servir — não casava por identificador nenhum. Ela caía no palpite do título, ou
 *  virava obra nova, duplicada, com a ficha vazia.
 *
 *  E o casamento por título era IGUALDADE EXATA: "Memórias Póstumas" não casava com
 *  "Memorias Postumas". O acervo tem os dois jeitos, porque veio de um dump.
 *
 *  ═══ E AS DUAS CASCATAS NÃO PODEM DIVERGIR ═══
 *
 *  Existem duas: `procurarNoCatalogo` (que a TELA usa para mostrar antes de gravar) e
 *  `findOrCreateWork` (que o BANCO usa na hora de gravar).
 *
 *  No dia em que discordarem, a tela mostra um livro e o banco grava outro — e a pessoa
 *  conferiu, confirmou, e recebeu outra coisa. É a pior traição possível numa tela cuja
 *  única razão de existir é a conferência.
 * ════════════════════════════════════════════════════════════════════
 */

const marca = Math.random().toString(36).slice(2, 8);

let obraId: string;
let autorId: string;
const criados: string[] = [];

/** Um livro do arquivo, com o mínimo. */
const linha = (p: Partial<LivroImportado>): LivroImportado => ({
  titulo: "",
  autor: null,
  isbn13: null,
  isbn10: null,
  editora: null,
  anoEdicao: null,
  anoObra: null,
  paginas: null,
  formato: null,
  status: "want_to_read",
  prateleiras: [],
  leituras: [],
  estrelas: null,
  resenha: null,
  notaPrivada: null,
  possui: false,
  ...p,
});

beforeAll(async () => {
  const [a] = await db.execute<{ id: string }>(sql`
    insert into authors (name, slug) values (${"Machado de Teste " + marca}, ${"machado-teste-" + marca})
    returning id`);
  autorId = a!.id;

  /**
   * Uma obra com ACENTO no título, e uma edição que só tem ISBN-10 — que é exatamente o
   * livro brasileiro de sebo, publicado antes de 2007.
   */
  const [w] = await db.execute<{ id: string }>(sql`
    insert into works (title, slug, author_id)
    values (${"Memórias Póstumas de Teste " + marca}, ${"memorias-teste-" + marca}, ${autorId}::uuid)
    returning id`);
  obraId = w!.id;
  criados.push(obraId);

  const [e] = await db.execute<{ id: string }>(sql`
    insert into editions (work_id, publisher, published_year)
    values (${obraId}::uuid, 'Editora de Teste', 1998)
    returning id`);

  await db.execute(sql`
    insert into identifiers (edition_id, kind, value)
    values (${e!.id}::uuid, 'isbn10', ${"85" + marca.slice(0, 8).padEnd(8, "0")})`);
});

afterAll(async () => {
  // `sql.param` é o que empacota um array de JS num array do Postgres. Sem ele, um array
  // de um elemento chega como string solta, e o banco recusa: "malformed array literal".
  await db.execute(sql`delete from works where id = any(${sql.param(criados)}::uuid[])`);
  await db.execute(sql`delete from authors where id = ${autorId}::uuid`);
});

const isbn10 = () => "85" + marca.slice(0, 8).padEnd(8, "0");

describe("o casamento do importador", () => {
  /**
   * ═══ O DEGRAU QUE FALTAVA ═══
   *
   * Sem ele, este livro cairia no palpite do título — e se o título viesse escrito de outro
   * jeito no arquivo (e vem: "Memorias Postumas", sem acento, é como metade dos exports
   * escreve), ele viraria uma obra NOVA, duplicada, com a ficha vazia.
   */
  it("casa pelo ISBN-10, que o livro brasileiro de antes de 2007 é o único que tem", async () => {
    const [achado] = await procurarNoCatalogo([
      linha({ titulo: "um título que não existe em lugar nenhum", isbn10: isbn10() }),
    ]);

    expect(
      achado!.como,
      "o ISBN-10 não casou. Metade da estante de quem compra em sebo cai no palpite do " +
        "título, ou vira obra nova duplicada.",
    ).toBe("isbn10");

    expect(ehFato(achado!.como), "o ISBN-10 é um fato, e não um palpite").toBe(true);
    expect(achado!.tituloNoCatalogo).toContain("Memórias Póstumas de Teste");
  });

  /**
   * ═══ ACENTO NÃO PODE SER UM LIVRO DIFERENTE ═══
   *
   * Era `lower(title) = lower(title)`. O acervo veio de um dump e tem os dois jeitos.
   */
  it("casa pelo título SEM ACENTO, porque o arquivo quase nunca traz acento", async () => {
    const [achado] = await procurarNoCatalogo([
      linha({
        titulo: "Memorias Postumas de Teste " + marca,
        autor: "Machado de Teste " + marca,
      }),
    ]);

    expect(
      achado!.como,
      "'Memorias Postumas' não casou com 'Memórias Póstumas'. O acervo tem os dois jeitos, " +
        "e o arquivo do outro app quase nunca traz acento.",
    ).toBe("titulo");
  });

  it("o que não existe vira obra NOVA, e a linha nunca é descartada", async () => {
    const [achado] = await procurarNoCatalogo([
      linha({ titulo: "Um livro que ninguém escreveu " + marca }),
    ]);

    expect(achado!.como).toBe("novo");
    expect(ehFato(achado!.como), "obra nova não é um fato: é uma criação").toBe(false);
  });

  /**
   * ════════════════════════════════════════════════════════════════════
   *  E AS DUAS CASCATAS CONCORDAM.
   *
   *  Uma é a que a TELA usa para mostrar; a outra é a que o BANCO usa para gravar. Se
   *  discordarem, a pessoa confere um livro e recebe outro — e a tela de conferência, que
   *  existe justamente para isso não acontecer, vira o veículo do erro.
   * ════════════════════════════════════════════════════════════════════
   */
  it("a cascata que MOSTRA e a cascata que GRAVA acham o mesmo livro", async () => {
    const casos = [
      linha({ titulo: "qualquer coisa", isbn10: isbn10() }),
      linha({
        titulo: "Memorias Postumas de Teste " + marca,
        autor: "Machado de Teste " + marca,
      }),
    ];

    for (const caso of casos) {
      const [visto] = await procurarNoCatalogo([caso]);

      const gravado = await findOrCreateWork({
        title: caso.titulo,
        author: caso.autor,
        isbn13: caso.isbn13,
        isbn10: caso.isbn10,
      });

      // Se `findOrCreateWork` tivesse criado uma obra nova, ela precisa sair no fim.
      if (gravado.como === "novo") criados.push(gravado.workId);

      expect(
        gravado.como,
        `a tela disse "${visto!.como}" e o banco fez "${gravado.como}". A pessoa confere um ` +
          "livro e recebe outro, e a tela de conferência vira o veículo do erro.",
      ).toBe(visto!.como);

      expect(
        gravado.workId,
        "a tela mostrou um livro e o banco gravou em OUTRO. É a pior traição possível " +
          "numa tela cuja única razão de existir é a conferência.",
      ).toBe(obraId);
    }
  });
});
