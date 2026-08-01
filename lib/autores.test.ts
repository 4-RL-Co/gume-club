import { describe, it, expect } from "vitest";
import { ehNomeDeAutor, limparNomeDeAutor, nomeDoAutor } from "@/lib/autores";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O PORTÃO DO CAMPO DE AUTOR.
 *
 *  O acervo tem 1.462 obras assinadas por "Brazil", 1.652 por "Portugal" e 554
 *  por "[author not identified]". Existe uma página /autor/portugal no ar.
 *
 *  Uma etiqueta é PIOR que um nulo. O nulo a gente conta, vê e conserta. A
 *  etiqueta passa por PESSOA em toda contagem, em toda busca e em toda poda — e
 *  foi ela que fez a poda achar que Madame Bovary tinha autor, e por pouco não
 *  apagou Madame Bovary por não reconhecer o Flaubert.
 * ════════════════════════════════════════════════════════════════════
 */

describe("gente passa", () => {
  it("nome comum, com acento, com inicial, com partícula", () => {
    for (const nome of [
      "Machado de Assis",
      "J. R. R. Tolkien",
      "Eça de Queirós",
      "bell hooks",
      "Лев Толстой",
      "三浦建太郎",
      "Itamar Vieira Junior",
    ]) {
      expect(ehNomeDeAutor(nome), `${nome} é gente e foi barrado`).toBe(true);
    }
  });

  it("um nome SUJO continua sendo um nome de gente", () => {
    /**
     * Este portão separa GENTE de ETIQUETA, e não nome limpo de nome sujo.
     *
     * "Machado de Machado de Assis" é um nome sujo — e é um nome de gente sujo. Ele
     * passa, e vira trabalho de bibliotecário. Um portão que tentasse julgar
     * QUALIDADE acabaria recusando autor de verdade, e esse é o erro caro.
     */
    expect(ehNomeDeAutor("Machado de Machado de Assis")).toBe(true);
    expect(ehNomeDeAutor("Platão Platão")).toBe(true);
    expect(ehNomeDeAutor("jaime arbe")).toBe(true);
  });

  it("e um nome de gente que CONTÉM um país também passa", () => {
    // "Portugal" o país não é gente. "Alberto Portugal" é.
    expect(ehNomeDeAutor("Alberto Portugal")).toBe(true);
    expect(ehNomeDeAutor("Ana Maria Brasil")).toBe(true);
  });
});

describe("etiqueta não passa", () => {
  it("as etiquetas da Open Library", () => {
    for (const lixo of [
      "[author not identified]",
      "invalid author ID",
      "[publisher not identified]",
      "Not Avail",
      "unknown",
    ]) {
      expect(ehNomeDeAutor(lixo), `"${lixo}" entrou como autor`).toBe(false);
    }
  });

  it("país e instituição", () => {
    expect(ehNomeDeAutor("Brazil")).toBe(false);
    expect(ehNomeDeAutor("Portugal")).toBe(false);
    expect(ehNomeDeAutor("Portugal.")).toBe(false);
    expect(ehNomeDeAutor("Portugal. Sovereign (1777-1816 : Maria I)")).toBe(false);
    expect(ehNomeDeAutor("Brazil. Ministério da Justiça")).toBe(false);
  });

  it("o anônimo e a antologia, que são respostas mas não são PESSOAS", () => {
    /**
     * Um livro anônimo tem autor NULO. Ele não tem um autor chamado "Anônimo", com uma
     * página de autor, uma estante e uma linha na estatística de nacionalidade.
     *
     * E "Vários autores" juntaria mil livros que não têm nada a ver uns com os outros
     * numa página só.
     */
    expect(ehNomeDeAutor("Anônimo")).toBe(false);
    expect(ehNomeDeAutor("Anonymous")).toBe(false);
    expect(ehNomeDeAutor("Autor desconhecido")).toBe(false);
    expect(ehNomeDeAutor("Vários autores")).toBe(false);
    expect(ehNomeDeAutor("Diversos autores")).toBe(false);
    expect(ehNomeDeAutor("VV.AA.")).toBe(false);
  });

  it("vazio, pontuação, número e letra solta", () => {
    expect(ehNomeDeAutor("")).toBe(false);
    expect(ehNomeDeAutor("   ")).toBe(false);
    expect(ehNomeDeAutor("---")).toBe(false);
    expect(ehNomeDeAutor("1950")).toBe(false);
    expect(ehNomeDeAutor("A.")).toBe(false);
    expect(ehNomeDeAutor(null)).toBe(false);
    expect(ehNomeDeAutor(42)).toBe(false);
  });
});

describe("limparNomeDeAutor devolve NULO, e não uma etiqueta", () => {
  it("porque nulo a gente vê, e etiqueta se disfarça", () => {
    expect(limparNomeDeAutor("[author not identified]")).toBeNull();
    expect(limparNomeDeAutor("Portugal.")).toBeNull();
    expect(limparNomeDeAutor("  Machado   de  Assis  ")).toBe("Machado de Assis");
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  OBRA SEM AUTOR ESCREVE "DESCONHECIDO", E O BANCO CONTINUA DIZENDO `null`.
 *
 *  Vazio na tela lê como "faltou preencher". Para a Saga de Njáll ou a Vida de Esopo
 *  isso é falso: elas são anônimas, e a ficha está completa.
 *
 *  A palavra mora na TELA de propósito. Criar um autor chamado "Desconhecido" seria
 *  recriar o "Jonathan C. Young" — 53 obras sem relação penduradas num registro, com
 *  página de perfil e lugar na busca — só que de propósito desta vez. E `null` no
 *  banco é o que permite listar depois o que ainda falta atribuir.
 * ════════════════════════════════════════════════════════════════════
 */
describe("o nome que a tela escreve quando não se sabe quem escreveu", () => {
  it("nome de verdade passa intacto", () => {
    expect(nomeDoAutor("Clarice Lispector")).toBe("Clarice Lispector");
  });

  it("sem autor vira Desconhecido", () => {
    expect(nomeDoAutor(null)).toBe("Desconhecido");
    expect(nomeDoAutor(undefined)).toBe("Desconhecido");
  });

  /** Nome só com espaços é o mesmo que nome nenhum, e já apareceu em ficha importada. */
  it("nome em branco também", () => {
    expect(nomeDoAutor("   ")).toBe("Desconhecido");
  });
});
