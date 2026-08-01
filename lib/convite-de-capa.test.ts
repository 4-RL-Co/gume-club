import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * ════════════════════════════════════════════════════════════════════
 *  LIVRO SEM CAPA PEDE UMA. EM VOZ ALTA, E NÃO NUM `title`.
 *
 *  ═══ O QUE ESTE TESTE PROTEGE ═══
 *
 *  231 livros que estão na estante de alguém não têm capa em fonte pública nenhuma.
 *  Foram tentados: o ISBN na Open Library, o ISBN no Google Books, e a busca por título
 *  e autor nas duas. São edições brasileiras pequenas que essas bases não cobrem.
 *  **Não existe API que resolva** — existe gente com o livro na mão.
 *
 *  O formulário para mandar a capa sempre existiu, atrás do lápis. O convite também
 *  existia... dentro de um atributo `title`, que **não aparece no celular** e que
 *  ninguém lê no computador. Pedir num lugar onde ninguém lê é não pedir.
 *
 *  ═══ E POR QUE ELE É CONDICIONAL ═══
 *
 *  Só quando falta capa. Um pedido permanente em toda página vira ruído, e ruído é o
 *  que faz a pessoa parar de ler os avisos do app — aí o próximo aviso, o que importa,
 *  também não é lido.
 * ════════════════════════════════════════════════════════════════════
 */
function semComentario(t: string): string {
  return t
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ");
}

describe("o convite de capa", () => {
  const arrumar = semComentario(readFileSync("components/arrumar.tsx", "utf8"));
  const pagina = semComentario(readFileSync("app/livro/[slug]/page.tsx", "utf8"));

  it("existe, e é texto na tela e não um title escondido", () => {
    expect(
      /Este livro está sem capa/.test(arrumar),
      "o convite de capa sumiu da tela. Sem ele, 231 livros ficam sem capa para sempre: " +
        "nenhuma API tem essas edições, e quem tem o livro na mão não sabe que pode ajudar.",
    ).toBe(true);
  });

  it("só aparece quando falta capa", () => {
    expect(
      /semCapa && !aberto/.test(arrumar),
      "o convite virou permanente. Pedido em toda página é ruído, e ruído faz a pessoa " +
        "parar de ler os avisos — inclusive o próximo, que vai importar.",
    ).toBe(true);
  });

  /**
   * A trava da trava: o componente pode saber pedir e a página nunca dizer que falta
   * capa. Aí o convite existe no código e não aparece para ninguém.
   */
  it("a página do livro diz ao componente quando a capa falta", () => {
    expect(
      /<Arrumar semCapa=\{!cover\?\.coverUrl\}/.test(pagina),
      "a página parou de avisar que o livro está sem capa: o convite existe no código " +
        "e não aparece em tela nenhuma.",
    ).toBe(true);
  });
});
