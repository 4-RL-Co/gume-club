import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O APP TEM DOIS TEMAS, E O TIME SÓ OLHA UM.
 *
 *  ═══ O BUG QUE ESTE ARQUIVO EXISTE POR CAUSA DE ═══
 *
 *  Um leitor criou conta com o sistema no tema claro e viu a barra lateral com um
 *  RETÂNGULO PRETO no lugar do item onde ele estava. Nas abas, a mesma coisa: blocos
 *  pretos onde deveria haver texto.
 *
 *  A causa era uma linha só:
 *
 *      .afiado { background: linear-gradient(180deg, #202020 0%, #171717 100%); }
 *
 *  Cor CRAVADA, escrita olhando para o tema escuro. `.afiado` é a classe que marca todo
 *  item ativo do app — barra lateral, abas da estante, abas de pessoas, estatísticas,
 *  recomendações. Uma linha, sete telas, e o texto por cima era `--color-ink`, que no
 *  claro é quase preto: preto no preto, invisível.
 *
 *  E o `--fio` (a lâmina, a marca virada interface) valia branco-osso no bloco do tema
 *  CLARO — que é a cor do escuro. Lâmina branca sobre papel branco.
 *
 *  ═══ POR QUE UM TESTE, E NÃO CUIDADO ═══
 *
 *  Porque cuidado não escala para uma coisa que ninguém vê. O time inteiro usa o escuro:
 *  no escuro, a cor cravada está CERTA, e a tela fica linda. O bug era invisível para
 *  todo mundo que podia consertá-lo, e visível só para quem estava chegando — que não
 *  reclama, fecha o app.
 *
 *  Um teste não tem tema preferido.
 * ════════════════════════════════════════════════════════════════════
 */
/**
 * Fora os comentários.
 *
 * Sem isto, este teste acusa a EXPLICAÇÃO do bug em vez do bug: o comentário do
 * `.afiado` cita "#202020" para contar o que deu errado, e o teste achava o hex ali e
 * ficava vermelho com a documentação. É o espelho do erro que o teste do celular
 * cometeu ao contrário (lá a prosa fazia ele passar; aqui, falhar). Nos dois casos a
 * lição é a mesma: comentário não é código.
 */
const css = readFileSync("app/globals.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, " ");

/** O bloco `@media (prefers-color-scheme: dark)`, que é onde o tema escuro mora. */
function blocoEscuro(): string {
  const i = css.indexOf("@media (prefers-color-scheme: dark)");
  expect(i, "não achei o tema escuro: este teste está cego").toBeGreaterThan(0);
  return css.slice(i, i + 2000);
}

describe("o tema claro existe de verdade", () => {
  /**
   * A regra: o item ativo não pode ter cor cravada. Ela TEM que vir de um token, porque
   * é o token que sabe em qual tema estamos.
   */
  it("o .afiado não crava cor nenhuma", () => {
    const i = css.indexOf(".afiado,");
    expect(i, "não achei o .afiado: este teste está cego").toBeGreaterThan(0);
    const regra = css.slice(i, css.indexOf("\n  }", i));

    const cravadas = regra.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(
      cravadas,
      "o item ativo voltou a ter cor cravada. No tema claro isso vira um bloco preto com " +
        "texto preto em cima, em sete telas de uma vez. A cor tem que vir de --afiado-de " +
        "e --afiado-para, que o tema escuro redefine.",
    ).toEqual([]);
  });

  /**
   * Todo token de tema tem que existir NOS DOIS. Um token que só o claro define fica com
   * o valor do claro no escuro — que é exatamente como o --fio virou branco-osso no tema
   * errado e ninguém notou por meses.
   */
  it.each(["--fio", "--afiado-de", "--afiado-para", "--afiado-borda", "--afiado-sombra"])(
    "%s é definido no claro E no escuro",
    (token) => {
      const claro = css.slice(0, css.indexOf("@media (prefers-color-scheme: dark)"));
      expect(claro, `${token} não tem valor no tema claro`).toContain(`${token}:`);
      expect(blocoEscuro(), `${token} não é redefinido no tema escuro`).toContain(`${token}:`);
    },
  );

  /**
   * O fio é a marca: a lâmina. Ele não pode ser a MESMA cor nos dois temas, porque num
   * ele é luz e no outro é tinta. Se os dois valores forem iguais, um dos dois está
   * invisível — e é sempre o claro, porque é o que ninguém abre.
   */
  it("o fio não é a mesma cor nos dois temas", () => {
    const doClaro = css.slice(0, css.indexOf("@media (prefers-color-scheme: dark)"))
      .match(/--fio:\s*(#[0-9a-fA-F]{3,8})/)?.[1];
    const doEscuro = blocoEscuro().match(/--fio:\s*(#[0-9a-fA-F]{3,8})/)?.[1];

    expect(doClaro, "o fio não tem cor no tema claro").toBeTruthy();
    expect(doEscuro, "o fio não tem cor no tema escuro").toBeTruthy();
    expect(
      doClaro,
      "o fio é a mesma cor nos dois temas: num deles ele está invisível, e é o claro",
    ).not.toBe(doEscuro);
  });
});
