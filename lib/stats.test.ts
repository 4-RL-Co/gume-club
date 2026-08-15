import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resumo, centuryLabel, MINIMO_PARA_FALAR, type Stats } from "@/lib/stats";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A LINHA QUE NÃO SE CRUZA, ESCRITA EM TESTE.
 *
 *  "Estatística da comunidade compara gostos, nunca desempenho. Média de
 *  livros lidos é o número que este app existe para não ter."
 *
 *  Regra escrita é regra que a próxima tela esquece. Este teste varre o
 *  código da estatística e quebra o build se o veneno voltar, porque ele
 *  volta exatamente assim: uma comparação inocente de cada vez.
 * ════════════════════════════════════════════════════════════════════
 */

const stats = readFileSync("lib/stats.ts", "utf8");
const tela = readFileSync("app/estatisticas/page.tsx", "utf8");

/** Sem comentário: o comentário PODE (e deve) citar o que é proibido, para explicar. */
function semComentario(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");
}

describe("a comunidade compara gosto, nunca esforço", () => {
  const codigo = semComentario(stats) + semComentario(tela);

  it.each([
    ["avg(", "média em SQL: se for de livro lido, é o veneno"],
    ["percentile_disc", "percentil é posição, e posição é ranking"],
    ["rank()", "ranking de leitor"],
    ["dense_rank", "ranking de leitor"],
    ["row_number", "posição de leitor"],
  ])("não usa %s fora do permitido", (termo) => {
    // A paciência usa avg() de DIAS DE ESPERA, que não é esforço nem produção:
    // é autoconhecimento, e não compara ninguém com ninguém. É a única exceção,
    // e ela está nomeada aqui para que uma segunda exceção precise passar por aqui.
    const usos = codigo.split(termo).length - 1;
    const permitidos = termo === "avg(" ? 1 : 0;
    expect(
      usos,
      `${termo} apareceu ${usos}x, e o permitido é ${permitidos}`,
    ).toBeLessThanOrEqual(permitidos);
  });

  it("a mediana da idade usa percentile_cont, e ela é sobre a OBRA, nunca sobre a pessoa", () => {
    // percentile_cont é permitido: ele mede a idade das OBRAS, e não a posição do LEITOR.
    expect(stats).toContain("percentile_cont");
    expect(stats).not.toMatch(/percentile_cont[\s\S]{0,200}count\(\*\)\s*\)?\s*as\s+livros/i);
  });

  it("nenhuma frase da tela põe o número de livros de outra pessoa ao lado do seu", () => {
    /**
     * O que a comunidade expõe é PAÍS, IDADE DE OBRA, EDITORA e QUANTAS PESSOAS
     * leram um livro. Nunca quantos livros uma pessoa leu.
     *
     * O comentário é removido de propósito: um comentário PRECISA poder citar o
     * que é proibido, porque é ali que a regra se explica para o próximo. O que
     * não pode aparecer é na TELA, que é onde a comparação viraria produto.
     */
    expect(semComentario(tela)).not.toMatch(
      /acima da média|abaixo da média|percentil|posição|ranking|placar/i,
    );
  });

  it("a comunidade nunca seleciona uma contagem de livros POR pessoa", () => {
    // count(distinct user_id) é gente que leu um livro (fato, e é permitido).
    // count(*) group by user_id seria livros por pessoa, que é o placar.
    expect(stats).not.toMatch(/count\([^)]*\)[\s\S]{0,120}group by[\s\S]{0,40}user_id/i);
  });
});

describe("a frase-resumo cala a boca quando não sabe", () => {
  const base: Stats = {
    books: 0, volumes: 0, series: 0, shelf: 10, pages: null,
    age: { median: 40, from: 1900, to: 2020, midpoint: 1980 },
    centuries: [], nationalities: [], publishers: [], origins: [], formats: [],
    verdicts: [], oldest: null, newest: null, reread: [], abandoned: 0,
    patienceMonths: null, years: [],
  };

  it("não inventa retrato em cima de 3 livros", () => {
    expect(resumo({ ...base, books: 3 })).toBeNull();
    expect(resumo({ ...base, books: MINIMO_PARA_FALAR - 1 })).toBeNull();
  });

  it("fala a partir de 5", () => {
    expect(resumo({ ...base, books: 5 })).not.toBeNull();
  });

  it("cala a boca quando não sabe a idade das obras", () => {
    expect(resumo({ ...base, books: 20, age: null })).toBeNull();
  });

  it("é determinística: a mesma entrada, a mesma frase, sempre", () => {
    const s = { ...base, books: 12 };
    expect(resumo(s)).toBe(resumo(s));
    expect(resumo(s)).toBe(resumo({ ...s }));
  });

  it("lê os mortos quando as obras são antigas", () => {
    expect(resumo({ ...base, books: 9, age: { median: 150, from: 1800, to: 1900, midpoint: 1850 } }))
      .toMatch(/mortos/);
  });

  it("nunca fala de quantidade, de meta, nem de ritmo", () => {
    for (const idade of [5, 20, 50, 120, 400]) {
      const frase = resumo({
        ...base, books: 30,
        age: { median: idade, from: 1500, to: 2020, midpoint: 1900 },
        nationalities: [{ label: "Brasileira", n: 25 }],
      });
      expect(frase).not.toMatch(/média|meta|ritmo|por mês|por ano|rápid|lent/i);
    }
  });
});

describe("o século", () => {
  it("escreve o a.C. do Sun Tzu", () => {
    expect(centuryLabel(-4)).toBe("século IV a.C.");
    expect(centuryLabel(21)).toBe("século XXI");
    expect(centuryLabel(19)).toBe("século XIX");
  });
});
