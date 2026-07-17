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

/**
 * ════════════════════════════════════════════════════════════════════
 *  O ESCURO ESTÁ ESCRITO DUAS VEZES, E TEM QUE SER IGUAL NOS DOIS.
 *
 *  O escuro acontece por dois caminhos — o sistema pede, ou a pessoa escolhe — e CSS não
 *  deixa juntar `@media` com atributo num seletor só. Então os tokens aparecem duplicados.
 *
 *  Duplicação assim não dá erro: ela DIVERGE. Daqui a três meses alguém acerta um tom no
 *  bloco de cima, não vê o de baixo, e o app passa a ter dois escuros ligeiramente
 *  diferentes — um para quem escolheu e outro para quem deixou no automático. Ninguém
 *  descobre isso olhando, porque ninguém vê os dois ao mesmo tempo.
 *
 *  Aqui os dois são comparados token por token.
 * ════════════════════════════════════════════════════════════════════
 */
describe("os dois escuros são o mesmo escuro", () => {
  const tokens = (bloco: string) =>
    Object.fromEntries(
      [...bloco.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]),
    );

  function corta(abertura: string): Record<string, string> {
    const i = css.indexOf(abertura);
    expect(i, `não achei "${abertura}": este teste está cego`).toBeGreaterThan(0);
    const fim = css.indexOf("}", i);
    return tokens(css.slice(i, fim));
  }

  it("o escuro do sistema e o escuro escolhido definem os mesmos tokens", () => {
    const doSistema = corta(':root:not([data-theme="light"])');
    const escolhido = corta(':root[data-theme="dark"]');

    expect(Object.keys(doSistema).length, "o bloco do sistema ficou vazio").toBeGreaterThan(5);
    expect(
      escolhido,
      "os dois escuros divergiram. Quem ESCOLHEU escuro passaria a ver um app diferente de " +
        "quem deixou no automático, e ninguém veria isso: as duas telas nunca aparecem juntas.",
    ).toEqual(doSistema);
  });

  /**
   * A ESCOLHA GANHA DO SISTEMA. Sem o `:not`, quem pedisse claro num computador no escuro
   * continuaria no escuro — e o botão viraria um enfeite que não faz nada, que é pior que
   * não ter botão.
   */
  it("escolher claro vence o sistema no escuro", () => {
    const i = css.indexOf("@media (prefers-color-scheme: dark)");
    const bloco = css.slice(i, css.indexOf("{", css.indexOf(":root", i)));
    expect(
      bloco,
      "o escuro do sistema não respeita a escolha: quem pedir claro num computador escuro " +
        "continua no escuro, e o botão de tema não faz nada",
    ).toContain(':not([data-theme="light"])');
  });
});
