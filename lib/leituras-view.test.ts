import { describe, it, expect } from "vitest";
import { resumoDasLeituras } from "@/lib/leituras-view";
import type { Leitura } from "@/lib/leituras";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O RESUMO DA GAVETA. Ele existe para a pessoa NÃO precisar abrir.
 *
 *  "quando você leu" virou uma gaveta porque corrigir uma data é coisa de uma vez
 *  na vida. Mas uma gaveta sem resumo obriga a abrir para descobrir se valia a pena
 *  abrir — e aí ela não economizou nada, só escondeu.
 *
 *  Então o resumo carrega a resposta: o ano. Estes testes travam isso, e travam que
 *  ele nunca mostra o 1º de janeiro que a gente pousa quando a pessoa marcou só o
 *  ano (ver lib/datas.ts).
 * ════════════════════════════════════════════════════════════════════
 */

const uma = (p: Partial<Leitura>): Leitura => ({
  id: "1",
  comecou: null,
  terminou: null,
  abandonou: null,
  ...p,
});

describe("o resumo diz o ano, e é isso que evita abrir a gaveta", () => {
  it("terminou: diz o ano em que terminou", () => {
    expect(resumoDasLeituras([uma({ terminou: "2019" })])).toBe("terminei em 2019");
  });

  it("com data completa, o resumo continua falando em ANO: ele é etiqueta, não ficha", () => {
    expect(resumoDasLeituras([uma({ terminou: "2019-03-14" })])).toBe("terminei em 2019");
  });

  it("abandonou: a palavra muda, porque a história é outra", () => {
    expect(resumoDasLeituras([uma({ abandonou: "2021" })])).toBe("larguei em 2021");
  });

  it("só começou: um livro em andamento também tem o que dizer", () => {
    expect(resumoDasLeituras([uma({ comecou: "2024-02-01" })])).toBe("comecei em 2024");
  });

  it("releitura: aí o fato é QUANTAS foram", () => {
    const duas = [uma({ id: "a", terminou: "2009" }), uma({ id: "b", terminou: "2024" })];
    expect(resumoDasLeituras(duas)).toBe("2 leituras");
  });

  it("uma leitura sem data nenhuma é legítima, e o resumo não inventa uma", () => {
    expect(resumoDasLeituras([uma({})])).toBe("sem data");
  });

  it("sem leitura nenhuma, não há resumo (a gaveta nem aparece)", () => {
    expect(resumoDasLeituras([])).toBe("");
  });

  /**
   * A garantia que importa: quem marcou "2019" nunca vê "1º de janeiro". Aquele dia é
   * um lugar de pousar, e não uma afirmação — mostrá-lo seria o app dizendo ao leitor
   * um dia que ele não disse.
   */
  it("nenhum resumo mostra um dia inventado", () => {
    const casos = [
      resumoDasLeituras([uma({ terminou: "2019" })]),
      resumoDasLeituras([uma({ abandonou: "2019" })]),
      resumoDasLeituras([uma({ comecou: "2019" })]),
    ];
    for (const texto of casos) {
      expect(texto, "o resumo deixou vazar um dia que o leitor nunca disse").not.toMatch(/-01-01|janeiro/);
    }
  });
});
