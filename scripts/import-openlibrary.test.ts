import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs script, no types. The parsing is what we test.
import { edition, isbn, year, isPortuguese } from "./import-openlibrary.mjs";

/** Registros no formato real do ol_dump_editions. */
const machado = {
  key: "/books/OL7353617M",
  title: "Dom Casmurro",
  languages: [{ key: "/languages/por" }],
  works: [{ key: "/works/OL15100572W" }],
  authors: [{ key: "/authors/OL29280A" }],
  isbn_13: ["978-85-359-0277-5"],
  isbn_10: ["8535902775"],
  publishers: ["Companhia das Letras"],
  publish_date: "May 2016",
  number_of_pages: 208,
  physical_format: "Paperback",
  covers: [8231856],
};

describe("filtro de língua", () => {
  it("aceita uma edição em português", () => {
    expect(isPortuguese(machado)).toBe(true);
  });

  it("recusa inglês, que é o grosso do dump", () => {
    expect(isPortuguese({ languages: [{ key: "/languages/eng" }] })).toBe(false);
  });

  it("recusa uma edição sem língua declarada em vez de chutar", () => {
    expect(isPortuguese({ title: "Sem língua" })).toBe(false);
  });

  it("aceita uma edição bilíngue que inclui português", () => {
    expect(isPortuguese({ languages: [{ key: "/languages/eng" }, { key: "/languages/por" }] })).toBe(true);
  });
});

describe("ano de publicação", () => {
  it.each([
    ["May 2016", 2016],
    ["2016-05-01", 2016],
    ["1899", 1899],
    ["", null],
    [undefined, null],
    ["sem data", null],
  ])("%s -> %s", (input, expected) => {
    expect(year(input)).toBe(expected);
  });

  it("recusa um ano absurdo em vez de guardar lixo", () => {
    expect(year("2301")).toBe(null);
    expect(year("0123")).toBe(null);
  });
});

describe("isbn", () => {
  it("tira os hífens", () => {
    expect(isbn(["978-85-359-0277-5"], 13)).toBe("9788535902775");
  });

  it("devolve null quando o tamanho não fecha: um ISBN torto é pior que nenhum", () => {
    expect(isbn(["978-85-359"], 13)).toBe(null);
  });

  it("mantém o X final de um ISBN-10", () => {
    expect(isbn(["85-359-0277-X"], 10)).toBe("853590277X");
  });

  it("aguenta a lista faltando", () => {
    expect(isbn(undefined, 13)).toBe(null);
  });
});

describe("mapeamento da edição", () => {
  it("mapeia um registro real", () => {
    expect(edition(machado)).toEqual({
      ol_edition: "/books/OL7353617M",
      ol_work: "/works/OL15100572W",
      /**
       * NULO, E DE PROPÓSITO. O registro de edição do dump TEM um autor aqui — e é
       * justamente por lê-lo que o acervo perdeu 47 mil autores.
       *
       * A edição em português quase nunca traz autor, e quando traz, o primeiro da
       * lista costuma ser o TRADUTOR ("A Morte de Ivan Ilitch" ficou assinada por
       * Roberto Algarte). A autoria mora no registro de OBRA, e quem a lê é o
       * scripts/backfill-authors.mjs.
       *
       * Este teste espera `null` porque `null` é a resposta CERTA: melhor um campo
       * vazio, que a gente vê e conserta, do que um nome errado, que ninguém sabe que
       * precisa conferir. Ver AGENTS.md.
       */
      ol_author: null,
      title: "Dom Casmurro",
      isbn13: "9788535902775",
      isbn10: "8535902775",
      publisher: "Companhia das Letras",
      published_year: 2016,
      page_count: 208,
      format: "paperback",
      cover_url: "https://covers.openlibrary.org/b/id/8231856-L.jpg",
    });
  });

  it("descarta uma edição sem obra: ela não teria onde morar", () => {
    expect(edition({ ...machado, works: [] })).toBe(null);
  });

  it("descarta uma edição sem título", () => {
    expect(edition({ ...machado, title: "  " })).toBe(null);
  });

  it("gruda o subtítulo no título", () => {
    expect(edition({ ...machado, subtitle: "romance" })?.title).toBe("Dom Casmurro: romance");
  });

  it("cai em 'other' num formato que não conhecemos, em vez de quebrar", () => {
    expect(edition({ ...machado, physical_format: "papiro" })?.format).toBe("other");
  });

  it("deixa a capa nula quando a OL não tem: a UI desenha uma tipográfica", () => {
    expect(edition({ ...machado, covers: [] })?.cover_url).toBe(null);
    expect(edition({ ...machado, covers: [-1] })?.cover_url).toBe(null);
  });

  it("recusa uma contagem de páginas impossível", () => {
    expect(edition({ ...machado, number_of_pages: 0 })?.page_count).toBe(null);
    expect(edition({ ...machado, number_of_pages: 999999 })?.page_count).toBe(null);
  });

  it("NUNCA lê o autor do registro de edição, nem quando ele está lá", () => {
    /**
     * O bug que custou 47 mil autores, virado teste.
     *
     * Este registro TEM `authors: [{ key: "/authors/OL29280A" }]`. E mesmo assim o
     * import devolve `null` — porque a autoria mora no registro de OBRA, e o primeiro
     * autor de uma edição em português costuma ser o tradutor.
     *
     * Se alguém "consertar" isto lendo o autor da edição de novo, o build cai aqui.
     */
    const comAutor = edition(machado);
    expect(
      comAutor?.ol_author,
      "o import voltou a ler o autor do registro de EDIÇÃO. Foi assim que 43.739 obras " +
        "ficaram sem autor e que 'A Morte de Ivan Ilitch' foi assinada pelo tradutor.",
    ).toBe(null);

    const semAutor = edition({ ...machado, authors: undefined });
    expect(semAutor?.ol_author).toBe(null);
    expect(semAutor?.title).toBe("Dom Casmurro");
  });
});
