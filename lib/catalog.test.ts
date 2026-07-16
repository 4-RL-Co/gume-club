import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { asIsbn, dedupe, type Hit } from "@/lib/catalog";

const hit = (over: Partial<Hit> = {}): Hit => ({
  source: "openlibrary",
  title: "Torto arado",
  author: "Itamar Vieira Junior",
  isbn13: null, isbn10: null, publisher: null, publishedYear: null,
  firstPublished: null,
  pageCount: null, coverUrl: null,
  openlibraryWorkKey: null, openlibraryEditionKey: null,
  ...over,
});

describe("asIsbn", () => {
  it("reconhece um ISBN-13 com hífen: é assim que ele está impresso na contracapa", () => {
    expect(asIsbn("978-85-359-0277-5")).toBe("9788535902775");
    expect(asIsbn("978 85 359 0277 5")).toBe("9788535902775");
  });

  it("reconhece um ISBN-10, inclusive com X", () => {
    expect(asIsbn("8535902775")).toBe("8535902775");
    expect(asIsbn("85-359-0277-x")).toBe("853590277X");
  });

  it("um título não é um ISBN", () => {
    expect(asIsbn("Dom Casmurro")).toBe(null);
    expect(asIsbn("1984")).toBe(null);
  });

  it("um número do tamanho errado não é um ISBN: melhor buscar por texto", () => {
    expect(asIsbn("12345")).toBe(null);
    expect(asIsbn("97885359027751")).toBe(null);
  });
});

describe("dedupe", () => {
  it("o mesmo ISBN duas vezes vira um resultado", () => {
    const out = dedupe([hit({ isbn13: "9788525056009" }), hit({ isbn13: "9788525056009", publisher: "Outra" })]);
    expect(out).toHaveLength(1);
  });

  it("sem ISBN, casa por título e autor", () => {
    expect(dedupe([hit(), hit()])).toHaveLength(1);
  });

  it("não junta livros diferentes do mesmo autor", () => {
    expect(dedupe([hit(), hit({ title: "Salvar o fogo" })])).toHaveLength(2);
  });

  it("dois ISBNs diferentes são duas edições, e as duas ficam", () => {
    const out = dedupe([hit({ isbn13: "9788525056009" }), hit({ isbn13: "9786559790010" })]);
    expect(out).toHaveLength(2);
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  UM APP EM PORTUGUÊS NÃO PEDE O MUNDO INTEIRO.
 *
 *  ═══ O BUG QUE ESTE TESTE EXISTE PARA IMPEDIR ═══
 *
 *  A busca de fora era chamada sem dizer o idioma, e as fontes respondiam o que tinham:
 *  "Blank Sudoku Grids 12x12", "All 2004-2009 Cadillac XLR Colors", "Czech Catholic Union
 *  of Texas", "Texas dance halls". Um leitor brasileiro digitava três letras e recebia um
 *  catálogo de galpões de fazenda do Kansas.
 *
 *  Medido na Open Library: "texas dance halls" devolve 21 fichas, todas em inglês. Com
 *  `language=por`, devolve 2 — e as duas são livros que existem em português de verdade.
 *  A linha inteira do conserto é um parâmetro que ninguém tinha escrito.
 *
 *  ═══ E O ISBN FICA DE FORA DA REGRA ═══
 *
 *  Ele é a única porta para um livro que NÃO está em português: quem tem o volume em
 *  inglês na mão escaneia a contracapa, e ele entra. Filtrar idioma ali fecharia essa
 *  porta sem ganhar nada, porque um ISBN não devolve lixo: ele devolve UM livro.
 *
 *  Este teste lê o código-fonte porque as duas funções falam com a rede. O que importa
 *  aqui não é o que elas devolvem: é o que elas PEDEM.
 * ════════════════════════════════════════════════════════════════════
 */
describe("a busca de fora pede português, e o ISBN é a exceção", () => {
  const fonte = readFileSync("lib/catalog.ts", "utf8");

  it("a Open Library é consultada com language=por quando a busca é por texto", () => {
    const porTexto = fonte.slice(fonte.indexOf("async function searchOpenLibrary"));
    expect(
      porTexto.slice(0, porTexto.indexOf("\n}")),
      "a busca por texto na Open Library voltou a pedir o mundo inteiro",
    ).toContain("language=por");
  });

  it("o Google Books é consultado com langRestrict=pt quando a busca é por texto", () => {
    const trecho = fonte.slice(fonte.indexOf("async function searchGoogleBooks"));
    expect(
      trecho.slice(0, trecho.indexOf("\n}")),
      "a busca por texto no Google Books voltou a pedir o mundo inteiro",
    ).toContain("langRestrict=pt");
  });

  /**
   * A busca por ISBN monta OUTRA URL, e ela não pode levar idioma junto. Se um dia as
   * duas virarem uma só, este teste cai — e é para cair: seria o dia em que o livro em
   * inglês na mão da pessoa deixou de entrar.
   */
  it("pelo ISBN, nenhuma das duas restringe idioma", () => {
    const ol = fonte.slice(fonte.indexOf("async function searchOpenLibrary"));
    const onde = ol.indexOf("?isbn=");

    // A TRAVA DA TRAVA: sem isto, um `indexOf` que não acha nada devolve -1, o slice sai
    // torto, e o teste passa sem ter olhado para coisa nenhuma. Um teste que não sabe
    // falhar é pior que teste nenhum, porque ele faz todo mundo parar de olhar.
    expect(onde, "não achei a consulta por ISBN na Open Library: este teste está cego").toBeGreaterThan(0);

    const linhaDoIsbn = ol.slice(onde, onde + 120);
    expect(linhaDoIsbn, "a busca por ISBN passou a restringir idioma").not.toContain("language=por");

    const g = fonte.slice(fonte.indexOf("async function searchGoogleBooks"));
    expect(
      g.slice(0, g.indexOf("\n}")),
      "o idioma no Google Books tem que ser condicional ao ISBN, e não fixo",
    ).toContain('isbn ? "" : "&langRestrict=pt"');
  });
});
