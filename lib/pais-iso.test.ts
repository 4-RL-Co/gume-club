import { describe, it, expect } from "vitest";
import { paisPorNome, PAIS_POR_NUMERICO } from "@/lib/pais-iso";

describe("paisPorNome: o nome do país (ou apelido) vira { iso2, pt }", () => {
  it("casa pelo nome canônico, do jeito que lib/paises.ts já escreve", () => {
    expect(paisPorNome("Brasil")).toEqual({ iso2: "BR", pt: "Brasil" });
    expect(paisPorNome("Reino Unido")).toEqual({ iso2: "GB", pt: "Reino Unido" });
    expect(paisPorNome("Estados Unidos")).toEqual({ iso2: "US", pt: "Estados Unidos" });
  });

  it("ignora maiúscula e acento", () => {
    expect(paisPorNome("brasil")).toEqual({ iso2: "BR", pt: "Brasil" });
    expect(paisPorNome("JAPAO")).toEqual({ iso2: "JP", pt: "Japão" });
  });

  it("casa pelos apelidos e adjetivos que o acervo ainda tem crus", () => {
    expect(paisPorNome("brasileira")).toEqual({ iso2: "BR", pt: "Brasil" });
    expect(paisPorNome("britânico")).toEqual({ iso2: "GB", pt: "Reino Unido" });
  });

  it("um nome que ninguém aqui reconhece não inventa um país", () => {
    expect(paisPorNome("Atlântida")).toBeNull();
    expect(paisPorNome("")).toBeNull();
  });
});

describe("PAIS_POR_NUMERICO: a tabela em si", () => {
  it("todo código alpha-2 é único — sem dois países apontando pro mesmo desenho", () => {
    const vistos = new Set<string>();
    for (const { iso2 } of Object.values(PAIS_POR_NUMERICO)) {
      expect(vistos.has(iso2), `iso2 duplicado: ${iso2}`).toBe(false);
      vistos.add(iso2);
    }
  });

  it("todo nome em português é único — sem dois códigos pro mesmo nome", () => {
    const vistos = new Set<string>();
    for (const { pt } of Object.values(PAIS_POR_NUMERICO)) {
      expect(vistos.has(pt), `nome duplicado: ${pt}`).toBe(false);
      vistos.add(pt);
    }
  });
});
