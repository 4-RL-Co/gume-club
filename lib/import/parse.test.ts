import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parse, detectar } from "@/lib/import/parse";
import { parseCsvObjetos, isbn, data } from "@/lib/import/csv";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A RÉGUA É SEM PERDAS, E ESTE TESTE É A RÉGUA.
 *
 *  Cada `it` aqui é uma armadilha que já derrubou um importador de
 *  verdade. Se um deles quebrar, alguém está prestes a perder dez anos
 *  de datas de leitura de outra pessoa.
 * ════════════════════════════════════════════════════════════════════
 */

const goodreads = readFileSync("lib/import/fixtures/goodreads.csv", "utf8");
const storygraph = readFileSync("lib/import/fixtures/storygraph.csv", "utf8");

describe("de onde veio o arquivo", () => {
  it("reconhece o Goodreads", () => {
    expect(detectar(goodreads)).toBe("goodreads");
  });

  it("reconhece o StoryGraph", () => {
    expect(detectar(storygraph)).toBe("storygraph");
  });

  it("um arquivo desconhecido ainda é importável", () => {
    const planilha = "Título,Autor,Lido\nGrande Sertão,Guimarães Rosa,Lido\n";
    expect(detectar(planilha)).toBe("desconhecida");
    expect(parse(planilha)[0]?.titulo).toBe("Grande Sertão");
    expect(parse(planilha)[0]?.status).toBe("read");
  });
});

describe("as armadilhas do CSV", () => {
  it("desarma a blindagem do Excel: ='9788535902775'", () => {
    // Sem isto, TODO ISBN falha, nada casa com as 414 mil edições do catálogo, e
    // cada livro vira uma obra duplicada nova.
    expect(isbn('="9788535902775"').isbn13).toBe("9788535902775");
    expect(isbn('="8535902775"').isbn10).toBe("8535902775");
  });

  it("um ISBN vazio é null, e nunca uma string vazia", () => {
    expect(isbn('=""')).toEqual({ isbn13: null, isbn10: null });
    expect(isbn(undefined)).toEqual({ isbn13: null, isbn10: null });
  });

  it("sobrevive a vírgula dentro de aspas", () => {
    const livros = parse(goodreads);
    expect(livros.map((l) => l.titulo)).toContain("Ficções, e outros contos");
  });

  it("sobrevive a QUEBRA DE LINHA dentro de um campo", () => {
    const csv = 'Title,My Review\n"Um livro","primeira linha\nsegunda linha"\n';
    const livros = parse(csv);
    expect(livros).toHaveLength(1);
    expect(livros[0]!.resenha).toContain("segunda linha");
  });

  it("sobrevive ao BOM que o Excel enfia na frente", () => {
    const comBom = "﻿Title,Author\nDom Casmurro,Machado\n";
    expect(parseCsvObjetos(comBom)[0]?.title).toBe("Dom Casmurro");
  });

  it("sobrevive ao ponto e vírgula do Excel em português", () => {
    expect(parseCsvObjetos("Título;Autor\nA hora da estrela;Clarice\n")[0]?.autor).toBe("Clarice");
  });
});

describe("as datas", () => {
  it("lê a data do Goodreads (2019/03/07) e a do StoryGraph (2019-03-07)", () => {
    expect(data("2019/03/07")).toBe("2019-03-07");
    expect(data("2019-03-07")).toBe("2019-03-07");
  });

  it("lê a data em português (07/03/2019), com o dia primeiro", () => {
    expect(data("07/03/2019")).toBe("2019-03-07");
  });

  it("NÃO INVENTA o dia: '2019' sozinho vira null", () => {
    // Uma data chutada é uma mentira que a pessoa carrega para sempre, e ela
    // aparece na retrospectiva do ano dela.
    expect(data("2019")).toBeNull();
    expect(data("May 2016")).toBeNull();
    expect(data("")).toBeNull();
  });
});

describe("o Goodreads, sem perdas", () => {
  const livros = parse(goodreads);
  const casmurro = livros.find((l) => l.titulo === "Dom Casmurro")!;

  it("traz os quatro livros", () => {
    expect(livros).toHaveLength(4);
  });

  it("traz a DATA em que ele terminou", () => {
    expect(casmurro.leituras.some((r) => r.terminou === "2019-03-07")).toBe(true);
  });

  it("RELEU 3 vezes: viram TRÊS leituras, e não uma", () => {
    // O Goodreads guarda só a data da ÚLTIMA leitura, mesmo com Read Count = 3.
    // A perda é DELE. Jogar as outras duas fora seria apagar duas leituras que
    // aconteceram: elas entram sem data, porque uma leitura sem data é um fato.
    expect(casmurro.leituras).toHaveLength(3);
    expect(casmurro.leituras.filter((r) => r.terminou !== null)).toHaveLength(1);
  });

  it("traz a nota", () => {
    expect(casmurro.estrelas).toBe(5);
  });

  it("nota 0 quer dizer NÃO AVALIEI, e não zero estrelas", () => {
    // Gravar 0 estoura o check do banco, que só aceita 1..5. E é bem que estoure:
    // uma nota zero é uma opinião que a pessoa nunca deu.
    const borges = livros.find((l) => l.titulo.startsWith("Ficções"))!;
    expect(borges.estrelas).toBeNull();
  });

  it("traz o texto da resenha, e LIMPA o HTML", () => {
    expect(casmurro.resenha).toContain("continua");
    expect(casmurro.resenha).not.toContain("<i>");
    expect(casmurro.resenha).toContain("\n"); // o <br/> virou quebra de linha
  });

  it("traz a NOTA PRIVADA, que é outra coisa que a resenha", () => {
    expect(casmurro.notaPrivada).toBe("reler em 2030");
  });

  it("traz as prateleiras que ELA inventou", () => {
    expect(casmurro.prateleiras).toEqual(["favoritos", "releituras"]);
  });

  it("as prateleiras EXCLUSIVAS (read, to-read) não viram estante inventada", () => {
    // Criar uma estante chamada "read" com 300 livros dentro é ruído, e é o lixo
    // que outros importadores despejam na conta da pessoa.
    for (const l of livros) {
      expect(l.prateleiras).not.toContain("read");
      expect(l.prateleiras).not.toContain("to-read");
    }
  });

  it("traz o ISBN, desarmado", () => {
    expect(casmurro.isbn13).toBe("9788535902775");
  });

  it("separa o ano da OBRA do ano da EDIÇÃO", () => {
    expect(casmurro.anoObra).toBe(1899); // quando Machado escreveu
    expect(casmurro.anoEdicao).toBe(2016); // quando esta tiragem saiu
  });

  it("mapeia os status", () => {
    expect(livros.find((l) => l.titulo.startsWith("Ficções"))!.status).toBe("want_to_read");
    expect(livros.find((l) => l.titulo === "O Estrangeiro")!.status).toBe("reading");
    expect(casmurro.status).toBe("read");
  });

  it("ter não é ler: 'Owned Copies' vira posse", () => {
    expect(casmurro.possui).toBe(true);
    expect(livros.find((l) => l.titulo === "A Rainha Vermelha")!.possui).toBe(false);
  });
});

describe("o StoryGraph, sem perdas", () => {
  const livros = parse(storygraph);
  const torto = livros.find((l) => l.titulo === "Torto Arado")!;

  it("RELEU: 'Dates Read' traz VÁRIAS datas, e todas contam", () => {
    // Achatar isso numa leitura só é o bug que este importador existe para evitar,
    // e é o dado mais difícil de reconstruir depois: ninguém lembra em que ano releu.
    expect(torto.leituras).toHaveLength(2);
    expect(torto.leituras.map((r) => r.terminou)).toEqual(["2021-03-09", "2023-04-02"]);
  });

  it("a estrela decimal (4.25) sobrevive até a hora de virar palavra", () => {
    expect(torto.estrelas).toBe(4.25);
  });

  it("did-not-finish é de primeira classe: um livro largado é um fato do seu ano", () => {
    const kafka = livros.find((l) => l.titulo === "A Metamorfose")!;
    expect(kafka.status).toBe("did_not_finish");
    expect(kafka.leituras[0]!.abandonou).toBe("2022-07-20");
    expect(kafka.leituras[0]!.terminou).toBeNull();
  });
});
