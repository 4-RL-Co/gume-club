import { describe, expect, it } from "vitest";
import { ehIngles, idiomaDe } from "./idioma";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O DETECTOR NÃO PODE CHUTAR.
 *
 *  Ele decide o que sai da tela e, um dia, o que sai do acervo. Um detector que
 *  chuta transforma "não sei" em "é inglês" — e aí ele apaga Ubirajara.
 *
 *  Todos os títulos daqui saíram do banco de verdade.
 * ════════════════════════════════════════════════════════════════════
 */
describe("idiomaDe", () => {
  it("reconhece o português", () => {
    expect(idiomaDe("Memórias Póstumas de Brás Cubas")).toBe("pt");
    expect(idiomaDe("O cortiço")).toBe("pt");
    expect(idiomaDe("A hora da estrela")).toBe("pt");
    expect(idiomaDe("Capitães da Areia")).toBe("pt");
  });

  it("reconhece o inglês", () => {
    // Do banco: fichas de catálogo acadêmico que ninguém aqui vai ler.
    expect(idiomaDe("Brazil in the world: views on Brazil's role in the global market")).toBe("en");
    expect(idiomaDe("High technology in intermediate countries?: the case of Brazil")).toBe("en");
    expect(idiomaDe("The Modern Prometheus is an 1818 novel written by an English author")).toBe("en");
  });

  /**
   * ═══ O TESTE QUE IMPEDE O ESTRAGO ═══
   *
   * "Frankenstein" é o título da edição BRASILEIRA de Frankenstein. "Berserk" é o
   * título do mangá que se vende aqui. "Ubirajara" é de José de Alencar.
   *
   * Nenhum deles tem uma palavra-esqueleto de língua nenhuma. Um detector que chuta
   * chamaria os três de ingleses — e apagaria José de Alencar do acervo.
   *
   * Não saber é uma resposta, e é a resposta certa. Ver AGENTS.md.
   */
  it("responde NULO quando não dá para saber, e nunca chuta 'inglês'", () => {
    expect(idiomaDe("Frankenstein")).toBeNull();
    expect(idiomaDe("Berserk")).toBeNull();
    expect(idiomaDe("Ubirajara")).toBeNull();
    expect(idiomaDe("Iracema")).toBeNull();
    expect(idiomaDe("Dom Casmurro")).toBeNull();
    expect(idiomaDe("Hamlet")).toBeNull();

    expect(ehIngles("Frankenstein")).toBe(false);
    expect(ehIngles("Berserk")).toBe(false);
    expect(ehIngles("Ubirajara")).toBe(false);
  });

  /**
   * ═══ O TÍTULO BILÍNGUE É PORTUGUÊS ═══
   *
   * O acervo tem centenas de catálogos de museu com o título nas duas línguas. Eles
   * são livros publicados no Brasil, em português, com uma tradução ao lado — e um
   * "the" solto lá dentro não faz deles livros em inglês.
   */
  it("um título bilíngue não vira inglês por causa de um 'the'", () => {
    expect(ehIngles("O burro e o boi no presépio =: The ass and the ox in the Nativity scene")).toBe(false);
    expect(
      ehIngles("As moedas contam a história do Brasil =: Coins tell the history of Brazil"),
    ).toBe(false);
  });

  it("o acento decide, mas a falta dele não acusa ninguém", () => {
    expect(idiomaDe("Grande Sertão: Veredas")).toBe("pt");
    // Sem acento e sem esqueleto: continua sendo "não sei".
    expect(idiomaDe("Vidas secas")).toBeNull();
  });

  it("texto vazio não é uma língua", () => {
    expect(idiomaDe(null)).toBeNull();
    expect(idiomaDe("")).toBeNull();
    expect(idiomaDe("   ")).toBeNull();
  });
});
