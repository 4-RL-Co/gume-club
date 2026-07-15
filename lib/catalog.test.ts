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
