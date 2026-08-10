import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * ════════════════════════════════════════════════════════════════════
 *  CLICAR NUM RESULTADO ABRE O LIVRO. NUNCA O PÕE NA ESTANTE.
 *
 *  ═══ O BUG ═══
 *
 *  Um resultado que já estava no acervo abria a página. Um que vinha de fora — que o
 *  Gume ainda não tinha — era PRATELEIRADO como "quero ler" no clique.
 *
 *  A razão era boa: sem ficha, o livro não tem página, então a única forma de "ver"
 *  era criar, e criar estava amarrado a prateleirar. O resultado é que quem só queria
 *  olhar saía com um livro na estante que não escolheu — e o pior é que os dois
 *  resultados pareciam iguais na tela, então nem dava para prever qual faria o quê.
 *
 *  ═══ A SEPARAÇÃO QUE O CONSERTO FAZ ═══
 *
 *  Criar a ficha é do CATÁLOGO: o livro passa a existir para quem buscar depois.
 *  Pôr na estante é da PESSOA. Nunca foram a mesma coisa; estavam presas na mesma
 *  função por conveniência.
 *
 *  Prateleirar continua existindo na barra, pelas teclas 1/2/3 e pelas pílulas — que
 *  são gestos DELIBERADOS. O que não pode é acontecer sozinho.
 * ════════════════════════════════════════════════════════════════════
 */
function semComentario(t: string): string {
  return t
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ");
}

describe("a busca abre o livro, e não o guarda", () => {
  const src = semComentario(readFileSync("components/command.tsx", "utf8"));

  it("clicar num resultado não prateleira nada", () => {
    // O clique do livro chama `abrir`, e mais nada.
    expect(
      /onClick=\{\(\) => void abrir\(h\)\}/.test(src),
      "o clique num resultado voltou a fazer outra coisa além de abrir o livro",
    ).toBe(true);

    expect(
      /shelve\(h, "want_to_read"\)/.test(src),
      "clicar num livro de fora voltou a pôr na estante como 'quero ler'. Quem só " +
        "queria olhar sai com um livro que não escolheu.",
    ).toBe(false);
  });

  it("o Enter também abre, e não guarda", () => {
    expect(
      /shelve\(livro, "want_to_read"\)/.test(src),
      "o Enter voltou a prateleirar o resultado de fora em vez de abri-lo",
    ).toBe(false);
  });

  /**
   * A trava da trava: prateleirar não pode SUMIR da barra. Ele continua no 1/2/3 e
   * nas pílulas, que são gestos deliberados — o conserto era tirá-lo do caminho de
   * quem só clica, e não tirá-lo do app.
   */
  it("mas prateleirar continua existindo, como gesto deliberado", () => {
    expect(
      /shelve\(livros\[cursor\], shelf\.status\)/.test(src),
      "as teclas 1/2/3 pararam de prateleirar: o conserto tirou a ação do caminho de " +
        "quem só clica, e não podia tirá-la do app.",
    ).toBe(true);
  });
});
