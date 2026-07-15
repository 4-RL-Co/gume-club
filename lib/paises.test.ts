import { describe, expect, it } from "vitest";
import { paisDe } from "./paises";

/**
 * ════════════════════════════════════════════════════════════════════
 *  UM PAÍS, UM NOME.
 *
 *  A /estatisticas diz "você leu autores de sete países". Se o Brasil aparecer como
 *  "Brasil" e como "Brasileira", ela dirá oito — e uma estatística que conta a mesma
 *  coisa duas vezes é uma estatística em que ninguém confia.
 *
 *  Todos os valores daqui saíram do banco de verdade, inclusive os dois que eu mesmo
 *  criei escrevendo uma regex esperta.
 * ════════════════════════════════════════════════════════════════════
 */
describe("paisDe", () => {
  it("o adjetivo é o país", () => {
    expect(paisDe("Brasileira")).toBe("Brasil");
    expect(paisDe("Britânica")).toBe("Reino Unido");
    expect(paisDe("Americana")).toBe("Estados Unidos");
    expect(paisDe("Indiana")).toBe("Índia");
  });

  it("a entidade histórica é o país de hoje", () => {
    // Camões é cidadão do Reino de Portugal; Pessoa, de Portugal. É o mesmo lugar.
    expect(paisDe("Reino de Portugal")).toBe("Portugal");
    expect(paisDe("União Soviética")).toBe("Rússia");
    expect(paisDe("Inglaterra")).toBe("Reino Unido");
    expect(paisDe("Áustria-Hungria")).toBe("Áustria");
  });

  /**
   * ═══ OS DOIS ESTRAGOS QUE A MINHA PRÓPRIA REGEX FEZ ═══
   *
   * A primeira versão disto tirava "Reino de", "República de" e afins do começo do
   * nome. Ela transformou "Reino Unido" em "Unido" (não tem "de") e a cidadania da
   * Clarice em "Socialista Soviética Ucraniana".
   *
   * Uma regex que remove um prefixo não sabe o que sobra. Um mapa sabe.
   */
  it("conserta o que a regex esperta estragou", () => {
    expect(paisDe("Unido")).toBe("Reino Unido");
    expect(paisDe("Socialista Soviética Ucraniana")).toBe("Ucrânia");
    expect(paisDe("República Socialista Soviética Ucraniana")).toBe("Ucrânia");
  });

  it("o nome que já está certo não se mexe", () => {
    expect(paisDe("Brasil")).toBe("Brasil");
    expect(paisDe("Portugal")).toBe("Portugal");
    expect(paisDe("Japão")).toBe("Japão");
    expect(paisDe("Moçambique")).toBe("Moçambique");
    expect(paisDe("Cabo Verde")).toBe("Cabo Verde");
  });

  /**
   * ═══ O QUE NÃO ESTÁ NA LISTA PASSA INTEIRO ═══
   *
   * Inventar um país é muito pior do que mostrar um nome estranho. Se aparecer um nome
   * novo e torto, ele chega na tela, alguém vê, e a lista ganha uma linha. O que ele
   * NUNCA pode fazer é virar outro país, ou virar um destroço.
   */
  it("o desconhecido volta inteiro, e nunca vira outra coisa", () => {
    expect(paisDe("Guiné-Bissau")).toBe("Guiné-Bissau");
    expect(paisDe("Timor-Leste")).toBe("Timor-Leste");
    expect(paisDe("São Tomé e Príncipe")).toBe("São Tomé e Príncipe");
  });

  it("vazio não é um país", () => {
    expect(paisDe(null)).toBeNull();
    expect(paisDe("")).toBeNull();
    expect(paisDe("   ")).toBeNull();
  });
});
