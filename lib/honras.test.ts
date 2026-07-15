import { describe, expect, it } from "vitest";
import {
  HONRAS, NOME, altura, coroaDe, escadaDe, nomeCompleto, piso, posicaoDe,
  type Forma, type Honra,
} from "./honras";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A ESCADA TEM QUE SER UMA ESCADA.
 *
 *  A honra é a coisa mais pública que o Gume mostra sobre uma pessoa: ela fica na
 *  moldura, no perfil, ao lado do nome. Se a conta estiver errada, ela está errada na
 *  cara de todo mundo — e o erro que ninguém perdoa é o degrau que anda para trás.
 * ════════════════════════════════════════════════════════════════════
 */
const FORMAS: Forma[] = ["livro", "quadrinho"];

describe("as duas escadas", () => {
  it("sobem, e nunca descem", () => {
    for (const forma of FORMAS) {
      const escada = escadaDe(forma);
      for (let i = 1; i < escada.length; i++) {
        expect(
          piso(forma, escada[i]!),
          `${escada[i]} não pode custar menos que ${escada[i - 1]} em ${forma}`,
        ).toBeGreaterThan(piso(forma, escada[i - 1]!));
      }
    }
  });

  /**
   * ═══ DOIS VOCABULÁRIOS, E NÃO DOIS NÚMEROS ═══
   *
   * Antes as duas escadas tinham os MESMOS nomes: "Ouro" na literatura eram 30 livros e
   * "Ouro" nos quadrinhos eram 75 volumes. Lado a lado no perfil, isso é duas palavras
   * iguais com dois números diferentes, e ninguém sabe qual é qual.
   *
   * Nenhum nome pode aparecer nas duas.
   */
  it("nenhuma honra existe nas duas escadas", () => {
    const livro = new Set<string>(HONRAS.livro);
    for (const q of HONRAS.quadrinho) {
      expect(livro.has(q), `"${q}" está nas duas escadas: lado a lado, isso confunde`).toBe(false);
    }
  });

  it("as duas terminam numa lâmina, porque é o mesmo app", () => {
    expect(HONRAS.livro[HONRAS.livro.length - 1]).toBe("gume");
    expect(HONRAS.quadrinho[HONRAS.quadrinho.length - 1]).toBe("katana");
  });

  /**
   * ═══ O TOPO TEM QUE SER ALCANÇÁVEL ═══
   *
   * Mil livros é um número que quase ninguém alcança numa vida. Uma escada cujo último
   * degrau é inatingível não é uma escada: é um pôster.
   *
   * Quinhentos são doze por ano, por quarenta anos. Isso é uma vida de leitor de verdade.
   */
  it("quinhentos livros é Gume, e não mil", () => {
    expect(piso("livro", "gume")).toBe(500);
    expect(posicaoDe("livro", 500).honra).toBe("gume");
    expect(posicaoDe("livro", 499).honra).toBe("navalha");
  });

  it("o quadrinho pede mais volumes que o livro pede livros, em todo degrau", () => {
    for (let i = 1; i < 10; i++) {
      expect(
        piso("quadrinho", HONRAS.quadrinho[i]!),
        "um volume de mangá se lê num quarto do tempo de um romance",
      ).toBeGreaterThan(piso("livro", HONRAS.livro[i]!));
    }
  });

  /**
   * O problema que as duas escadas existem para consertar: ler Bleach são 74 volumes, e
   * ler Guerra e Paz é 1. Numa escada só, o mangá ganha por construção.
   */
  it("cada escada mede na régua dela", () => {
    expect(posicaoDe("quadrinho", 146).honra).toBe("samurai");
    expect(posicaoDe("livro", 146).honra).toBe("esmeralda");
    expect(posicaoDe("livro", 15).honra).toBe("prata");
  });
});

describe("o paragon", () => {
  /**
   * ═══ DEPOIS DO TOPO, A ESCADA NÃO ACABA ═══
   *
   * "Gume +1", "Gume +2". É o Paragon do Diablo: quem chegou ao fim continua tendo o que
   * fazer, e o app não precisa inventar um degrau novo a cada dois anos.
   */
  it("cada 25 livros depois do Gume vale uma estrela", () => {
    expect(posicaoDe("livro", 500).estrelas).toBe(0);
    expect(posicaoDe("livro", 524).estrelas).toBe(0);
    expect(posicaoDe("livro", 525).estrelas).toBe(1);
    expect(posicaoDe("livro", 550).estrelas).toBe(2);
    expect(posicaoDe("livro", 1000).estrelas).toBe(20);
  });

  it("o nome sai com o mais, e nunca com vinte estrelinhas desenhadas", () => {
    expect(nomeCompleto(posicaoDe("livro", 500))).toBe("Gume");
    expect(nomeCompleto(posicaoDe("livro", 550))).toBe("Gume +2");
    expect(nomeCompleto(posicaoDe("livro", 30))).toBe("Ouro");
    expect(nomeCompleto(posicaoDe("quadrinho", 1310))).toBe("Katana +1");
  });

  /**
   * No topo, a barra passa a medir a distância até a PRÓXIMA ESTRELA — e não fica cheia
   * e parada para sempre. Uma barra que nunca mais se move zomba de quem chegou.
   */
  it("no topo, a barra mede a próxima estrela", () => {
    const p = posicaoDe("livro", 510);
    expect(p.honra).toBe("gume");
    expect(p.proxima).toBeNull();
    expect(p.faltam).toBe(15); // 525 - 510
    expect(p.fracao).toBeCloseTo(10 / 25);
  });

  it("quem está no topo e não tem estrela ainda vê a barra vazia, e não cheia", () => {
    expect(posicaoDe("livro", 500).fracao).toBe(0);
  });
});

describe("a barra", () => {
  it("enche do começo ao fim do degrau", () => {
    expect(posicaoDe("livro", 5).honra).toBe("bronze");
    expect(posicaoDe("livro", 5).fracao).toBe(0);
    expect(posicaoDe("livro", 10).fracao).toBeCloseTo(0.5);
    expect(posicaoDe("livro", 15).honra).toBe("prata");
  });

  it("nunca sai de 0 a 1, em nenhum número", () => {
    for (const forma of FORMAS) {
      for (let n = 0; n <= 3000; n += 7) {
        const f = posicaoDe(forma, n).fracao;
        expect(f, `${forma} com ${n}`).toBeGreaterThanOrEqual(0);
        expect(f, `${forma} com ${n}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("número quebrado ou negativo não quebra a escada", () => {
    expect(posicaoDe("livro", -4).honra).toBe("ferro");
    expect(posicaoDe("livro", 7.9).quantas).toBe(7);
  });
});

describe("comparar as duas escadas", () => {
  /**
   * A moldura da cara da pessoa é a da escada MAIOR. E "maior" é por DEGRAU, e nunca
   * pelo número cru: 146 volumes de mangá não podem ganhar de 146 livros só por serem
   * o mesmo número — as duas escadas existem exatamente para isso não acontecer.
   */
  it("compara por degrau, e nunca pelo número cru", () => {
    const livro = posicaoDe("livro", 150); // Diamante, o 7º degrau
    const manga = posicaoDe("quadrinho", 150); // Kenshi, o 5º degrau
    expect(altura(livro)).toBeGreaterThan(altura(manga));
  });

  it("a estrela desempata dentro do topo", () => {
    expect(altura(posicaoDe("livro", 550))).toBeGreaterThan(altura(posicaoDe("livro", 500)));
  });
});

describe("a voz", () => {
  it("toda honra tem um nome que uma pessoa lê", () => {
    for (const forma of FORMAS) {
      for (const h of escadaDe(forma)) {
        const nome = NOME[h as Honra];
        expect(nome).toBeTruthy();
        expect(nome, `"${nome}" tem cara de nome de variável`).not.toMatch(/_|^[a-z]/);
      }
    }
  });

  /**
   * ═══ NADA AQUI É COPIADO DO LEAGUE OF LEGENDS ═══
   *
   * "Mestre", "Grão-Mestre" e "Desafiante" são LoL, e não dizem nada sobre ler. E a
   * palavra "elo" também saiu: o Gume não é decalque de ninguém.
   */
  it("nenhuma honra é copiada do League of Legends", () => {
    const nomes = [...HONRAS.livro, ...HONRAS.quadrinho].map((h) => NOME[h as Honra].toLowerCase());
    for (const proibido of ["mestre", "grão-mestre", "desafiante", "challenger", "elo"]) {
      expect(nomes, `"${proibido}" é LoL, e não diz nada sobre ler`).not.toContain(proibido);
    }
  });
});


describe("a moldura da cara mostra a honra MAIS ALTA", () => {
  const semApoio = { apoia: false, moldura: null };

  /**
   * Uma pessoa tem duas honras e **uma cara só**. Alguma das duas tem que ir para o anel.
   *
   * É sempre a mais alta, e nunca a escolha da pessoa: quem leu 300 livros e 12 mangás
   * escolheria mostrar o Aprendiz num dia de modéstia, e aí o anel deixaria de dizer
   * alguma coisa sobre a pessoa e passaria a dizer alguma coisa sobre o humor dela.
   *
   * Um sinal que depende de escolha não é um sinal: é um enfeite.
   */
  it("entre as duas, ganha a de degrau mais alto", () => {
    const muitoLivro = posicaoDe("livro", 300); // Lâmina, o 8º degrau
    const poucoManga = posicaoDe("quadrinho", 12); // Discípulo, o 2º

    expect(coroaDe(muitoLivro, poucoManga, semApoio)).toEqual({ honra: "lamina", estrelas: 0 });
    // E a ordem dos argumentos não muda a resposta.
    expect(coroaDe(poucoManga, muitoLivro, semApoio)).toEqual({ honra: "lamina", estrelas: 0 });
  });

  /**
   * ═══ "MAIS ALTA" É POR DEGRAU, E NUNCA PELO NÚMERO CRU ═══
   *
   * 146 volumes de mangá (Samurai, o 4º degrau) não podem ganhar de 150 livros (Diamante,
   * o 7º) só por serem quase o mesmo número. As duas escadas existem exatamente para isso
   * não acontecer, e comparar pelo número desfaria as duas de uma vez.
   */
  it("o número cru não decide nada", () => {
    const livros = posicaoDe("livro", 150); // Diamante, 7º
    const volumes = posicaoDe("quadrinho", 146); // Samurai, 4º

    expect(volumes.quantas).toBeLessThan(livros.quantas + 5); // são quase o mesmo número
    expect(coroaDe(livros, volumes, semApoio)).toEqual({ honra: "diamante", estrelas: 0 });
  });

  it("a estrela do topo vai junto", () => {
    const gume = posicaoDe("livro", 575); // Gume +3
    const nada = posicaoDe("quadrinho", 0);

    expect(coroaDe(gume, nada, semApoio)).toEqual({ honra: "gume", estrelas: 3 });
  });

  /**
   * ═══ O APOIO É A ÚNICA COISA QUE PASSA NA FRENTE ═══
   *
   * E ele não COMPETE com a honra: substitui. A moldura de apoiador não diz quanto você
   * leu, diz que você paga a conta do servidor. É outra coisa, e não um degrau acima do
   * Gume.
   */
  it("quem apoia e escolheu a moldura de apoiador usa a de apoiador", () => {
    const gume = posicaoDe("livro", 1000);
    const nada = posicaoDe("quadrinho", 0);

    expect(coroaDe(gume, nada, { apoia: true, moldura: "apoiador" })).toEqual({ apoiador: true });
  });

  /**
   * A coluna guarda a ESCOLHA, e não o DIREITO. Quem para de apoiar perde a moldura
   * sozinho, e ninguém precisa passar limpando escolha de quem cancelou.
   */
  it("quem escolheu a moldura de apoiador e parou de apoiar volta para a honra", () => {
    const prata = posicaoDe("livro", 15);
    const nada = posicaoDe("quadrinho", 0);

    expect(coroaDe(prata, nada, { apoia: false, moldura: "apoiador" })).toEqual({
      honra: "prata",
      estrelas: 0,
    });
  });

  it("quem apoia mas não escolheu continua mostrando a honra", () => {
    const prata = posicaoDe("livro", 15);
    const nada = posicaoDe("quadrinho", 0);

    expect(coroaDe(prata, nada, { apoia: true, moldura: null })).toEqual({
      honra: "prata",
      estrelas: 0,
    });
  });

  it("quem não leu nada tem a moldura do Ferro, e não fica sem moldura", () => {
    const zero = posicaoDe("livro", 0);
    const zeroQ = posicaoDe("quadrinho", 0);

    expect(coroaDe(zero, zeroQ, semApoio)).toEqual({ honra: "ferro", estrelas: 0 });
  });

  void altura;
});
