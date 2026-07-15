import { describe, it, expect } from "vitest";
import { nomeDeAutor, ehLatino } from "@/lib/nomes";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O NOME QUE VAI PARA A TELA.
 *
 *  O acervo perdeu o autor de 43.739 obras porque o import lia a autoria do
 *  registro de EDIÇÃO, e a edição em português quase nunca traz um. O conserto
 *  é ler o registro de OBRA — e o registro de obra guarda "Лев Толстой".
 *
 *  Se a gente recarregar assim, troca um problema por outro: em vez de o Gume
 *  não saber quem escreveu Guerra e Paz, ele mostra "Лев Толстой" na estante de
 *  um leitor brasileiro, e a busca por "Tolstói" continua devolvendo nada.
 *
 *  Um conserto que só aparece no banco não é um conserto.
 * ════════════════════════════════════════════════════════════════════
 */

describe("o que é alfabeto latino, e o que não é", () => {
  it("acento, cedilha, hífen e ponto são latinos", () => {
    expect(ehLatino("Eça de Queirós")).toBe(true);
    expect(ehLatino("Antoine de Saint-Exupéry")).toBe(true);
    expect(ehLatino("J. R. R. Tolkien")).toBe(true);
    expect(ehLatino("Liev Tolstói")).toBe(true);
  });

  it("cirílico, kanji, grego e árabe não são", () => {
    expect(ehLatino("Лев Толстой")).toBe(false);
    expect(ehLatino("三浦建太郎")).toBe(false);
    expect(ehLatino("Ὅμηρος")).toBe(false);
    expect(ehLatino("نجيب محفوظ")).toBe(false);
  });

  it("o MISTO também não serve para a tela", () => {
    /**
     * "三浦建太郎 (Kentaro Miura)" é como o acervo guarda o mangaká hoje. Ele TEM o nome
     * latino dentro, mas o kanji vem na frente — e na estante isso aparece como um
     * borrão seguido de um parêntese. Não serve.
     */
    expect(ehLatino("三浦建太郎 (Kentaro Miura)")).toBe(false);
  });

  it("um nome vazio ou só de pontuação não é nome nenhum", () => {
    expect(ehLatino("")).toBe(false);
    expect(ehLatino("   ")).toBe(false);
    expect(ehLatino("---")).toBe(false);
  });
});

describe("Tolstói: o caso que motivou este arquivo", () => {
  const tolstoi = {
    name: "Лев Толстой",
    personal_name: "Толстой, Лев Николаевич",
    alternate_names: ["Leo Tolstoy", "Tolstoy, Leo", "Lev Nikolayevich Tolstoy"],
  };

  it("a TELA recebe o nome em alfabeto latino", () => {
    const r = nomeDeAutor(tolstoi)!;
    expect(
      r.nome,
      "o Gume ia mostrar cirílico na estante de um leitor brasileiro",
    ).toBe("Leo Tolstoy");
  });

  it("e o cirílico vira SINÔNIMO, para a busca continuar achando", () => {
    const r = nomeDeAutor(tolstoi)!;
    expect(r.sinonimos).toContain("Лев Толстой");
  });

  it("a forma invertida da biblioteca vira um nome de gente", () => {
    // "Tolstoy, Leo" é como a biblioteca escreve. Não é como a pessoa se chama.
    const r = nomeDeAutor({ name: "Tolstoy, Leo", alternate_names: [] })!;
    expect(r.nome).toBe("Leo Tolstoy");
  });

  it("mas ela CONTINUA como sinônimo: tem gente que digita assim", () => {
    const r = nomeDeAutor({ name: "Tolstoy, Leo", alternate_names: [] })!;
    expect(r.sinonimos).toContain("Tolstoy, Leo");
  });
});

describe("o mangaká em kanji", () => {
  it("a tela recebe o nome romano, e o kanji vira sinônimo", () => {
    const r = nomeDeAutor({
      name: "三浦建太郎",
      alternate_names: ["Kentaro Miura", "Miura Kentarō"],
    })!;

    expect(r.nome).toBe("Kentaro Miura");
    expect(r.sinonimos).toContain("三浦建太郎");
  });
});

describe("quando NÃO existe grafia latina, a gente não inventa", () => {
  it("fica o que a Open Library deu, e vira tarefa de bibliotecário", () => {
    /**
     * Uma transliteração chutada por algoritmo é pior que um cirílico honesto: o
     * cirílico a gente SABE que precisa consertar; o "Tolstoi" errado a gente não sabe.
     */
    const r = nomeDeAutor({ name: "Лев Толстой", alternate_names: [] })!;
    expect(r.nome).toBe("Лев Толстой");
  });

  it("um autor sem nome nenhum devolve nada, em vez de uma linha vazia", () => {
    expect(nomeDeAutor({})).toBeNull();
    expect(nomeDeAutor({ name: "", alternate_names: [] })).toBeNull();
  });
});

describe("o que NÃO é para desinverter", () => {
  it("uma data depois da vírgula não é um primeiro nome", () => {
    const r = nomeDeAutor({ name: "Camões, 1524?-1580", alternate_names: [] })!;
    expect(r.nome, "'1524?-1580 Camões' não é o nome de ninguém").toBe("Camões, 1524?-1580");
  });

  it("um sufixo depois da vírgula também não", () => {
    const r = nomeDeAutor({ name: "Vieira Junior, Jr.", alternate_names: [] })!;
    expect(r.nome).toBe("Vieira Junior, Jr.");
  });
});

describe("os sinônimos não crescem sem limite", () => {
  it("no máximo doze, porque a Open Library às vezes traz cinquenta", () => {
    const r = nomeDeAutor({
      name: "Fulano",
      alternate_names: Array.from({ length: 40 }, (_, i) => `Fulano ${i}`),
    })!;

    expect(r.sinonimos.length).toBeLessThanOrEqual(12);
  });
});

describe("os dois erros que a medição de verdade pegou, e os testes não", () => {
  it("Albert Einstein não vira 'Einstein'", () => {
    /**
     * A primeira versão preferia `alternate_names` sobre `name`, para fugir do cirílico
     * do Tolstói. Funcionava para o Tolstói, e quebrava todo o resto: o `name` do
     * Einstein já é latino e perfeito, e virou "Einstein" — porque foi essa a primeira
     * grafia que apareceu na sacola de apelidos.
     *
     * `alternate_names` é ótima como plano B e péssima como primeira escolha. O `name`
     * só é um borrão quando não é latino.
     *
     * Este bug NÃO foi pego por teste nenhum. Ele foi pego olhando a amostra que o
     * script imprimiu antes de escrever — e é por isso que o script imprime a amostra.
     */
    const r = nomeDeAutor({
      name: "Albert Einstein",
      alternate_names: ["Einstein", "Professor Albert Einstein", "Albert Einstein Ph.D."],
    })!;

    expect(r.nome).toBe("Albert Einstein");
    expect(r.sinonimos).toContain("Einstein");
  });

  it("e o Tolstói continua escapando do cirílico, que era o ponto original", () => {
    const r = nomeDeAutor({
      name: "Лев Толстой",
      alternate_names: ["Leo Tolstoy", "Lev Tolstoi"],
    })!;
    expect(r.nome).toBe("Leo Tolstoy");
  });

  it("'Portugal.' não é uma pessoa, e não pode virar autor de livro nenhum", () => {
    /**
     * Isto não é lixo NOSSO: é lixo que veio da própria Open Library, e que o backfill
     * ia reescrever alegremente no acervo. "Portugal." apareceu duas vezes na amostra
     * dos autores que entrariam.
     *
     * Uma etiqueta no campo de autor é PIOR que um nulo: o nulo a gente conta e vê;
     * a etiqueta passa por autor de verdade em toda contagem, em toda busca e em toda
     * poda. Foi ela que fez a poda achar que Madame Bovary tinha autor.
     */
    expect(nomeDeAutor({ name: "Portugal." })).toBeNull();
    expect(nomeDeAutor({ name: "Brazil" })).toBeNull();
    expect(nomeDeAutor({ name: "[author not identified]" })).toBeNull();
    expect(nomeDeAutor({ name: "invalid author ID" })).toBeNull();
    expect(nomeDeAutor({ name: "Portugal. Sovereign (1777-1816 : Maria I)" })).toBeNull();
  });

  it("mas um nome de gente que COMEÇA com algo parecido continua entrando", () => {
    // "Portugal" o país não é gente. "Alberto Portugal" é.
    expect(nomeDeAutor({ name: "Alberto Portugal" })?.nome).toBe("Alberto Portugal");
  });
});
