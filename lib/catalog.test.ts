import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { asIsbn, dedupe, type Hit } from "@/lib/catalog";

/** O código-fonte: estes testes olham o que a busca PEDE, e não o que ela devolve. */
const fonte = readFileSync("lib/catalog.ts", "utf8");

const hit = (over: Partial<Hit> = {}): Hit => ({
  source: "openlibrary",
  title: "Torto arado",
  author: "Itamar Vieira Junior",
  isbn13: null, isbn10: null, publisher: null, publishedYear: null,
  firstPublished: null,
  pageCount: null, coverUrl: null,
  openlibraryWorkKey: null, openlibraryEditionKey: null,
  ...over,
});

describe("asIsbn", () => {
  it("reconhece um ISBN-13 com hífen: é assim que ele está impresso na contracapa", () => {
    expect(asIsbn("978-85-359-0277-5")).toBe("9788535902775");
    expect(asIsbn("978 85 359 0277 5")).toBe("9788535902775");
  });

  it("reconhece um ISBN-10, inclusive com X", () => {
    expect(asIsbn("8535902775")).toBe("8535902775");
    expect(asIsbn("85-359-0277-x")).toBe("853590277X");
  });

  it("um título não é um ISBN", () => {
    expect(asIsbn("Dom Casmurro")).toBe(null);
    expect(asIsbn("1984")).toBe(null);
  });

  it("um número do tamanho errado não é um ISBN: melhor buscar por texto", () => {
    expect(asIsbn("12345")).toBe(null);
    expect(asIsbn("97885359027751")).toBe(null);
  });
});

describe("dedupe", () => {
  it("o mesmo ISBN duas vezes vira um resultado", () => {
    const out = dedupe([hit({ isbn13: "9788525056009" }), hit({ isbn13: "9788525056009", publisher: "Outra" })]);
    expect(out).toHaveLength(1);
  });

  it("sem ISBN, casa por título e autor", () => {
    expect(dedupe([hit(), hit()])).toHaveLength(1);
  });

  it("não junta livros diferentes do mesmo autor", () => {
    expect(dedupe([hit(), hit({ title: "Salvar o fogo" })])).toHaveLength(2);
  });

  it("dois ISBNs diferentes são duas edições, e as duas ficam", () => {
    const out = dedupe([hit({ isbn13: "9788525056009" }), hit({ isbn13: "9786559790010" })]);
    expect(out).toHaveLength(2);
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  UM APP EM PORTUGUÊS NÃO PEDE O MUNDO INTEIRO.
 *
 *  ═══ O BUG QUE ESTE TESTE EXISTE PARA IMPEDIR ═══
 *
 *  A busca de fora era chamada sem dizer o idioma, e as fontes respondiam o que tinham:
 *  "Blank Sudoku Grids 12x12", "All 2004-2009 Cadillac XLR Colors", "Czech Catholic Union
 *  of Texas", "Texas dance halls". Um leitor brasileiro digitava três letras e recebia um
 *  catálogo de galpões de fazenda do Kansas.
 *
 *  Medido na Open Library: "texas dance halls" devolve 21 fichas, todas em inglês. Com
 *  `language=por`, devolve 2 — e as duas são livros que existem em português de verdade.
 *  A linha inteira do conserto é um parâmetro que ninguém tinha escrito.
 *
 *  ═══ E O ISBN FICA DE FORA DA REGRA ═══
 *
 *  Ele é a única porta para um livro que NÃO está em português: quem tem o volume em
 *  inglês na mão escaneia a contracapa, e ele entra. Filtrar idioma ali fecharia essa
 *  porta sem ganhar nada, porque um ISBN não devolve lixo: ele devolve UM livro.
 *
 *  Este teste lê o código-fonte porque as duas funções falam com a rede. O que importa
 *  aqui não é o que elas devolvem: é o que elas PEDEM.
 * ════════════════════════════════════════════════════════════════════
 */
describe("a busca de fora pede português, e o ISBN é a exceção", () => {

  it("a Open Library é consultada com language=por quando a busca é por texto", () => {
    const porTexto = fonte.slice(fonte.indexOf("async function searchOpenLibrary"));
    expect(
      porTexto.slice(0, porTexto.indexOf("\n}")),
      "a busca por texto na Open Library voltou a pedir o mundo inteiro",
    ).toContain("language=por");
  });

  it("o Google Books é consultado com langRestrict=pt quando a busca é por texto", () => {
    const trecho = fonte.slice(fonte.indexOf("async function searchGoogleBooks"));
    expect(
      trecho.slice(0, trecho.indexOf("\n}")),
      "a busca por texto no Google Books voltou a pedir o mundo inteiro",
    ).toContain("langRestrict=pt");
  });

  /**
   * A busca por ISBN monta OUTRA URL, e ela não pode levar idioma junto. Se um dia as
   * duas virarem uma só, este teste cai — e é para cair: seria o dia em que o livro em
   * inglês na mão da pessoa deixou de entrar.
   */
  it("pelo ISBN, nenhuma das duas restringe idioma", () => {
    const ol = fonte.slice(fonte.indexOf("async function searchOpenLibrary"));
    const onde = ol.indexOf("?isbn=");

    // A TRAVA DA TRAVA: sem isto, um `indexOf` que não acha nada devolve -1, o slice sai
    // torto, e o teste passa sem ter olhado para coisa nenhuma. Um teste que não sabe
    // falhar é pior que teste nenhum, porque ele faz todo mundo parar de olhar.
    expect(onde, "não achei a consulta por ISBN na Open Library: este teste está cego").toBeGreaterThan(0);

    const linhaDoIsbn = ol.slice(onde, onde + 120);
    expect(linhaDoIsbn, "a busca por ISBN passou a restringir idioma").not.toContain("language=por");

    const g = fonte.slice(fonte.indexOf("async function searchGoogleBooks"));
    expect(
      g.slice(0, g.indexOf("\n}")),
      "o idioma no Google Books tem que ser condicional, e não fixo: pelo ISBN não " +
        "filtra, e na segunda tentativa (o mundo inteiro) também não",
    ).toContain('isbn || !soPt ? "" : "&langRestrict=pt"');
  });
});


/**
 * ════════════════════════════════════════════════════════════════════
 *  PREFERIR PORTUGUÊS NÃO É PROIBIR O RESTO.
 *
 *  ═══ O QUE A FILA DE PEDIDOS VEIO CONTAR ═══
 *
 *  O filtro de idioma nasceu certo e foi implementado errado: ele PROIBIA. Dois dias
 *  depois a fila de pedidos mostrou o preço, na voz de um leitor de verdade:
 *
 *      Locomotion and Posture in Older Adults  ·  pedido 2 vezes
 *
 *  A Open Library TEM esse livro. É a pesquisa de alguém, existe só em inglês, e o app
 *  respondia que ele não existe.
 *
 *  Sumir com o livro certo é pior que mostrar um errado: o errado a pessoa ignora, o
 *  certo ela nunca descobre que existiu. A frase já estava escrita em semIngles(), e o
 *  código ao lado não a seguia.
 *
 *  A regra agora: português primeiro, e o mundo SÓ quando o português não tem nada.
 * ════════════════════════════════════════════════════════════════════
 */
describe("o português vem primeiro, e o mundo é o plano B", () => {
  const busca = (() => {
    const i = fonte.indexOf("export async function search(");
    expect(i, "não achei o search(): este teste está cego").toBeGreaterThan(0);
    return fonte.slice(i, fonte.indexOf("\n}", i));
  })();

  it("tenta em português antes de tudo", () => {
    expect(busca, "a busca deixou de preferir português").toContain("searchOpenLibrary(query, null, true)");
  });

  /**
   * ═══ E O GOOGLE NÃO PARTICIPA DA ETAPA DO PORTUGUÊS ═══
   *
   * Medido: `langRestrict=pt` devolve "Neurologic Interventions for Physical Therapy".
   * O parâmetro do Google é uma SUGESTÃO, não uma regra. Com ele nessa etapa, a busca
   * "em português" nunca voltava vazia — vinha cheia de inglês fuzzy — e o plano B nunca
   * disparava: o filtro parecia funcionar enquanto escondia o livro certo.
   */
  it("o Google fica fora da etapa do português: o langRestrict dele não filtra", () => {
    // A etapa do português começa no `emPortugues` e acaba no `noMundo`. O bloco do
    // ISBN, acima dela, chama o Google com todo direito: lá idioma não existe.
    const i = busca.indexOf("const emPortugues");
    const f = busca.indexOf("const noMundo");
    expect(i, "não achei a etapa do português: este teste está cego").toBeGreaterThan(0);
    expect(f, "não achei o plano B: este teste está cego").toBeGreaterThan(i);
    const etapaPt = busca.slice(i, f);
    expect(
      etapaPt,
      "o Google voltou para a etapa do português. O langRestrict dele não filtra de " +
        "verdade, e o inglês fuzzy que ele devolve bloqueia o plano B.",
    ).not.toContain("searchGoogleBooks");
  });

  /**
   * O CORAÇÃO: sem esta segunda tentativa, um livro que só existe em inglês some do app,
   * e a pessoa que o procurou conclui que ele não existe. Foi o que aconteceu.
   */
  it("cai para o mundo inteiro quando o português não tem nada", () => {
    expect(
      busca,
      "a busca voltou a PROIBIR outros idiomas em vez de preferir português. Um livro " +
        "que só existe em inglês volta a sumir, e quem o procurou conclui que ele não " +
        "existe. Ver o pedido 'Locomotion and Posture in Older Adults'.",
    ).toContain("searchOpenLibrary(query, null, false)");
  });

  it("pelo ISBN, idioma não existe: é a porta do livro que a pessoa tem na mão", () => {
    const porIsbn = busca.slice(busca.indexOf("if (isbn)"), busca.indexOf("emPortugues"));
    expect(porIsbn, "não achei o caminho do ISBN: este teste está cego").toContain("searchOpenLibrary");
    expect(porIsbn, "a busca por ISBN passou a filtrar idioma").not.toContain("true");
  });
});
