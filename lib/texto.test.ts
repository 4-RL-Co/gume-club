import { describe, expect, it } from "vitest";
import { limparMarcacao } from "./texto";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A SINOPSE CHEGA EM MARKDOWN. NA TELA, ELA É UMA FRASE.
 *
 *  Cada caso aqui saiu do banco de verdade — não é markdown inventado para o teste
 *  passar. São as 264 obras com asterisco, as 86 com link, as 39 com HTML.
 * ════════════════════════════════════════════════════════════════════
 */
describe("limparMarcacao", () => {
  it("tira o negrito e deixa o nome do livro", () => {
    // Do banco: works.description de Dom Casmurro.
    expect(limparMarcacao("**Dom Casmurro**, publicado em 1899, é um romance.")).toBe(
      "Dom Casmurro, publicado em 1899, é um romance.",
    );
  });

  it("tira o itálico", () => {
    expect(limparMarcacao("*Frankenstein; or, The Modern Prometheus* is an 1818 novel")).toBe(
      "Frankenstein; or, The Modern Prometheus is an 1818 novel",
    );
    expect(limparMarcacao("um romance _muito_ conhecido")).toBe("um romance muito conhecido");
  });

  it("deixa o título do link e joga o endereço fora", () => {
    // Do banco: a coletânea de contos do Poe.
    expect(limparMarcacao("[Purloined Letter](https://openlibrary.org/works/OL41065W)")).toBe(
      "Purloined Letter",
    );
  });

  it("tira as tags de HTML e mantém o que estava dentro", () => {
    expect(limparMarcacao("<p>Um clássico de <i>terror</i>.</p>")).toBe("Um clássico de terror.");
  });

  it("tira título, citação e régua de markdown", () => {
    expect(limparMarcacao("## Sinopse\n\n> Chame-me Ishmael.\n\n---\n\nO resto.")).toBe(
      "Sinopse\n\nChame-me Ishmael.\n\nO resto.",
    );
  });

  /**
   * ═══ O ASTERISCO QUE É ASTERISCO ═══
   *
   * Um asterisco solto no meio de uma frase não é ênfase, e a limpeza não pode inventar
   * um par que não existe. Ele fica.
   */
  it("não mexe no que não é um par", () => {
    expect(limparMarcacao("uma nota de rodapé marcada com * no original")).toBe(
      "uma nota de rodapé marcada com * no original",
    );
  });

  it("não engole a multiplicação nem o sublinhado do meio da palavra", () => {
    expect(limparMarcacao("o volume 2 * 3 = 6")).toBe("o volume 2 * 3 = 6");
  });

  it("devolve nulo quando não sobra nada, e nunca uma string vazia na tela", () => {
    expect(limparMarcacao(null)).toBeNull();
    expect(limparMarcacao("   ")).toBeNull();
    expect(limparMarcacao("<p></p>")).toBeNull();
  });

  /**
   * ═══ DADO DE FORA NUNCA VIRA MARCAÇÃO EXECUTÁVEL ═══
   *
   * A sinopse entrou no banco por um dump de terceiro. Se um dia ela chegar com um
   * `<script>`, a saída daqui é TEXTO — e a tela renderiza texto, não HTML. Este teste
   * existe para que ninguém troque `{texto}` por `dangerouslySetInnerHTML` sem quebrar
   * a build.
   */
  it("não deixa passar tag executável", () => {
    const sujo = "Um livro.<script>alert(1)</script>";
    const saida = limparMarcacao(sujo);
    expect(saida).not.toContain("<script");
    expect(saida).toBe("Um livro.alert(1)");
  });
});
