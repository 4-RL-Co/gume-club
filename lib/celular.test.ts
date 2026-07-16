import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O CELULAR ALCANÇA O APP INTEIRO.
 *
 *  ═══ O BUG QUE ESTE ARQUIVO EXISTE POR CAUSA DE ═══
 *
 *  A busca morava em dois lugares, e os dois eram do desktop: o campo dentro da coluna
 *  de vidro (`hidden … sm:flex`) e o atalho ⌘K — um atalho de TECLADO, num aparelho que
 *  não tem teclado.
 *
 *  Resultado: passada a tela de boas-vindas, quem estava no telefone não tinha NENHUM
 *  caminho até a busca. Nem para achar um livro, nem para cadastrar o que não existe no
 *  acervo. Achar um livro e pôr na estante é o app inteiro, e ele estava fora do alcance
 *  de metade das pessoas.
 *
 *  E não havia como perceber olhando: **não havia botão quebrado, havia botão nenhum.**
 *  Um bug que não deixa rastro na tela é um bug que só o usuário descobre — e ele não
 *  reclama, ele fecha o app.
 *
 *  ═══ POR QUE UM TESTE, E NÃO UM COMENTÁRIO ═══
 *
 *  Porque a regra é invisível. Quem mexer na barra de baixo amanhã vê quatro links e uma
 *  lupa, e a lupa parece a mais dispensável das cinco — ela não leva a lugar nenhum, ela
 *  dispara um evento. Sem este teste, ela sai num "limpei a navegação" e o buraco volta
 *  em silêncio, exatamente como ele nasceu.
 * ════════════════════════════════════════════════════════════════════
 */
/**
 * Fora os comentários.
 *
 * ═══ E ISTO NÃO É ZELO: A PRIMEIRA VERSÃO DESTE TESTE PASSOU SEM A LUPA ═══
 *
 * A lupa foi removida de propósito para conferir se o teste acusava, e ele ficou VERDE:
 * a palavra `abrirBusca` continuava na barra... dentro de um COMENTÁRIO que dizia "ver
 * abrirBusca()". O teste estava lendo a prosa que promete a trava, e não a trava.
 *
 * É o mesmo erro que `honras.regras.test.ts` já tinha documentado, cometido de novo uma
 * feature depois. Comentário não é código, e um teste que não sabe a diferença é um
 * teste que só serve para dar sossego.
 */
function semComentario(texto: string): string {
  return texto
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ");
}

describe("o celular chega na busca", () => {
  const fonte = semComentario(readFileSync("components/sidebar.tsx", "utf8"));

  /** A barra de baixo é a única `<GlassBar as="nav">`, e ela é `sm:hidden`. */
  function barraDoCelular(): string {
    const inicio = fonte.indexOf('as="nav"');
    // A TRAVA DA TRAVA: um indexOf que não acha devolve -1, o slice sai torto, e o teste
    // passa sem ter olhado para nada. Teste que não sabe falhar é pior que teste nenhum.
    expect(inicio, "não achei a barra de baixo do celular: este teste está cego").toBeGreaterThan(0);

    const fim = fonte.indexOf("</GlassBar>", inicio);
    expect(fim, "não achei o fim da barra do celular: este teste está cego").toBeGreaterThan(inicio);

    return fonte.slice(inicio, fim);
  }

  it("a barra que o teste olha é mesmo a do celular", () => {
    expect(barraDoCelular(), "a barra de baixo deixou de ser só do celular").toContain("sm:hidden");
  });

  /**
   * O coração da coisa: um jeito de abrir a busca COM O DEDO. O ⌘K continua existindo
   * para quem tem teclado, e não substitui isto.
   */
  it("a barra de baixo abre a busca sem teclado", () => {
    expect(
      barraDoCelular(),
      "a busca sumiu do celular. Sem ela, quem está no telefone não tem como achar um " +
        "livro nem cadastrar o que falta, e o ⌘K não salva ninguém: celular não tem ⌘.",
    ).toContain("abrirBusca");
  });

  /**
   * E ela é uma função só, chamada pelos dois (o campo do desktop e a lupa do celular).
   * Duas cópias de "como se abre a busca" divergem no dia em que o atalho mudar, e aí uma
   * das duas para de abrir sem ninguém perceber.
   */
  it("desktop e celular abrem a busca pela mesma porta", () => {
    const chamadas = fonte.match(/abrirBusca/g) ?? [];
    expect(
      chamadas.length,
      "abrirBusca tem que ser declarada uma vez e chamada por dois: o campo do desktop e " +
        "a lupa do celular",
    ).toBeGreaterThanOrEqual(3); // a declaração + as duas chamadas
  });
});
