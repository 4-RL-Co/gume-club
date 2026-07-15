import { describe, it, expect } from "vitest";
import { oAcervoTem } from "@/lib/catalog";
import type { Hit } from "@/lib/catalog";

/**
 * ════════════════════════════════════════════════════════════════════
 *  "O ACERVO TEM ESTE LIVRO?" — a pergunta que decide se um pedido é anotado.
 *
 *  A busca do Gume usa trigrama, e trigrama PERDOA: é por isso que "clarise"
 *  acha Clarice, e é ótimo que ache.
 *
 *  Mas o mesmo perdão faz "berserk" devolver SETE livros do nosso acervo,
 *  sendo que não temos um único. São títulos que se parecem, e nada mais.
 *
 *  Para MOSTRAR na busca, tudo bem: a pessoa olha e descarta. Para CONCLUIR
 *  "já temos esse livro", é veneno — porque é essa conclusão que faz a
 *  torneira NÃO anotar o pedido. O leitor sai sem o livro, e ninguém fica
 *  sabendo que faltou.
 *
 *  Este arquivo existe para que a régua dura continue dura.
 * ════════════════════════════════════════════════════════════════════
 */

function nosso(title: string, author: string | null = null): Hit {
  return {
    source: "gume",
    title,
    author,
    isbn13: null, isbn10: null, publisher: null,
    publishedYear: null, firstPublished: null, pageCount: null,
    coverUrl: null, openlibraryWorkKey: null, openlibraryEditionKey: null,
  };
}

function deFora(title: string, author: string | null = null): Hit {
  return { ...nosso(title, author), source: "google_books" };
}

describe("o que o acervo TEM de verdade", () => {
  it("casa quando o título bate", () => {
    expect(oAcervoTem("dom casmurro", [nosso("Dom Casmurro", "Machado de Assis")])).toBe(true);
  });

  it("casa quando a pessoa digita título E autor", () => {
    expect(
      oAcervoTem("dom casmurro machado", [nosso("Dom Casmurro", "Machado de Assis")]),
    ).toBe(true);
  });

  it("perdoa acento e maiúscula, como o resto do app", () => {
    expect(oAcervoTem("MEMORIAS POSTUMAS", [nosso("Memórias Póstumas de Brás Cubas")])).toBe(true);
  });

  it("ignora as palavrinhas que não distinguem livro nenhum", () => {
    expect(oAcervoTem("o cortiço", [nosso("O Cortiço", "Aluísio Azevedo")])).toBe(true);
  });
});

describe("o que o acervo NÃO tem, por mais parecido que o trigrama ache", () => {
  it("um título que só SE PARECE não conta", () => {
    /**
     * Este é o caso de verdade, medido no app: buscar "berserk" devolvia sete livros
     * do nosso acervo, e nenhum deles era Berserk. Se isso contasse como "temos", a
     * torneira nunca anotaria o Kentaro Miura — e ele é justamente um dos 46 mangakás
     * que o acervo não tem.
     */
    const parecidos = [
      nosso("Berserker: contos de guerra"),
      nosso("O berço do serviço social"),
      nosso("Bersek e outras histórias"),
    ];

    expect(
      oAcervoTem("berserk kentaro miura", parecidos),
      "um casamento fraco do trigrama calou a torneira. O leitor sai sem o livro, e " +
        "ninguém fica sabendo que faltou.",
    ).toBe(false);
  });

  it("meia palavra não basta: TODAS as palavras têm que estar lá", () => {
    expect(oAcervoTem("sapiens harari", [nosso("Sapiens: uma breve história")])).toBe(false);
    expect(oAcervoTem("sapiens harari", [nosso("Sapiens", "Yuval Noah Harari")])).toBe(true);
  });

  it("o que veio DE FORA não é o nosso acervo", () => {
    /**
     * O coração da opção que a gente escolheu. O Google tem Harari; nós não temos. Se
     * o resultado do Google contasse como "o acervo tem", o pedido sumiria — e a fila
     * de qual autor trazer em seguida ficaria eternamente vazia, que é o único jeito
     * de ela não servir para nada.
     */
    expect(
      oAcervoTem("sapiens harari", [deFora("Sapiens", "Yuval Noah Harari")]),
      "um livro que o GOOGLE tem foi contado como se o acervo tivesse",
    ).toBe(false);
  });

  it("busca vazia não é uma busca", () => {
    expect(oAcervoTem("", [nosso("Dom Casmurro")])).toBe(false);
    expect(oAcervoTem("   ", [nosso("Dom Casmurro")])).toBe(false);
  });

  it("sem nenhum resultado, o acervo obviamente não tem", () => {
    expect(oAcervoTem("qualquer coisa", [])).toBe(false);
  });
});
