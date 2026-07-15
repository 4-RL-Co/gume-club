import { describe, it, expect } from "vitest";
import { readParams, FILTERS, STATUS_LABEL, DIRECAO_LABEL } from "@/lib/shelf-view";

/**
 * The shelf keeps its state in the URL, which means the URL is untrusted input.
 * A junk query string must fall back to a sane view, never throw and never widen
 * what gets shown.
 */
describe("readParams", () => {
  it("cai no padrão quando não vem nada", () => {
    expect(readParams({})).toEqual({
      filter: "tudo", sort: "adicionado", view: "parede", direcao: "desc", ano: null,
    });
  });

  it("lê os parâmetros", () => {
    expect(readParams({ filtro: "lendo", ordem: "autor", vista: "lista" })).toEqual({
      filter: "lendo", sort: "autor", view: "lista", direcao: "asc", ano: null,
    });
  });

  it("ignora valor desconhecido em vez de quebrar a página", () => {
    expect(readParams({ filtro: "roubado", ordem: "; drop table works", vista: "3d" })).toEqual({
      filter: "tudo", sort: "adicionado", view: "parede", direcao: "desc", ano: null,
    });
  });

  it("aguenta o mesmo parâmetro repetido, que o navegador deixa mandar", () => {
    expect(readParams({ filtro: ["lidos", "lendo"] }).filter).toBe("lidos");
  });
});

describe("a direção da ordem", () => {
  it("cada critério tem o padrão que faz sentido PARA ELE", () => {
    // Título começa em A. Adicionado começa pelo mais recente. Um padrão único para
    // todos os critérios estaria errado em metade deles.
    expect(readParams({ ordem: "titulo" }).direcao).toBe("asc");
    expect(readParams({ ordem: "autor" }).direcao).toBe("asc");
    expect(readParams({ ordem: "ano" }).direcao).toBe("desc");
    expect(readParams({ ordem: "adicionado" }).direcao).toBe("desc");
  });

  it("a pessoa pode inverter", () => {
    expect(readParams({ ordem: "titulo", dir: "desc" }).direcao).toBe("desc");
    expect(readParams({ ordem: "ano", dir: "asc" }).direcao).toBe("asc");
  });

  it("uma direção inventada cai no padrão, e não quebra a página", () => {
    expect(readParams({ ordem: "titulo", dir: "de lado" }).direcao).toBe("asc");
  });

  it("o rótulo MUDA com o critério: 'A a Z' não quer dizer nada para um ano", () => {
    expect(DIRECAO_LABEL.titulo.asc).toBe("A a Z");
    expect(DIRECAO_LABEL.ano.asc).toBe("as mais antigas");
    expect(DIRECAO_LABEL.adicionado.desc).toBe("os mais novos");

    // E nenhum rótulo é "crescente"/"decrescente", que é jargão de planilha e não
    // descreve o que a pessoa vai ver.
    for (const par of Object.values(DIRECAO_LABEL)) {
      expect(par.asc).not.toMatch(/crescente/i);
      expect(par.desc).not.toMatch(/crescente/i);
    }
  });
});

describe("o ano da leitura", () => {
  it("lê um ano de verdade", () => {
    expect(readParams({ ano: "2021" }).ano).toBe(2021);
  });

  it("recusa lixo em vez de estourar", () => {
    expect(readParams({ ano: "ontem" }).ano).toBeNull();
    expect(readParams({ ano: "1200" }).ano).toBeNull();
    expect(readParams({ ano: "3000" }).ano).toBeNull();
  });
});

describe("as prateleiras", () => {
  it("são as cinco, e só 'tudo' não é um status", () => {
    expect(FILTERS.map((f) => f.key)).toEqual(["tudo", "lendo", "lidos", "esperando", "abandonados"]);
    expect(FILTERS.find((f) => f.key === "tudo")?.status).toBe(null);
  });

  it("cobre todo status do banco: um livro sem rótulo some da estante", () => {
    for (const status of ["want_to_read", "reading", "read", "did_not_finish"]) {
      expect(STATUS_LABEL[status]).toBeTruthy();
      expect(FILTERS.some((f) => f.status === status)).toBe(true);
    }
  });
});

