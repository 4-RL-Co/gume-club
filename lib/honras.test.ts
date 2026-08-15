import { describe, expect, it } from "vitest";
import {
  HONRAS, NOME, coroaDe, escada, nomeCompleto, piso, pisoEmPaginas, posicaoDe,
  posicaoPorPaginas, melhorPosicao, paragonEmLeituras, paragonEmPaginas, type Honra,
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

describe("a escada", () => {
  it("sobe, e nunca desce", () => {
    const e = escada();
    for (let i = 1; i < e.length; i++) {
      expect(
        piso(e[i]!),
        `${e[i]} não pode custar menos que ${e[i - 1]}`,
      ).toBeGreaterThan(piso(e[i - 1]!));
    }
  });

  it("termina no Gume, porque é o fio", () => {
    expect(HONRAS[HONRAS.length - 1]).toBe("gume");
  });

  /**
   * ═══ O TOPO TEM QUE SER ALCANÇÁVEL ═══
   *
   * Mil leituras é um número que quase ninguém alcança numa vida. Uma escada cujo último
   * degrau é inatingível não é uma escada: é um pôster.
   *
   * Quinhentas são doze por ano, por quarenta anos. Isso é uma vida de leitor de verdade.
   */
  it("quinhentas leituras é Gume, e não mil", () => {
    expect(piso("gume")).toBe(500);
    expect(posicaoDe(500).honra).toBe("gume");
    expect(posicaoDe(499).honra).toBe("navalha");
  });

  /**
   * ═══ UMA ESCADA SÓ, E CADA LEITURA CONTA IGUAL ═══
   *
   * Livro, HQ e volume de mangá contam a mesma coisa. Quem lê mangá sobe mais rápido, e
   * tudo bem: a honra é um retrato de quanto você leu, e não um prêmio de dificuldade.
   */
  it("não separa por forma: o número é o número", () => {
    expect(posicaoDe(146).honra).toBe("esmeralda");
    expect(posicaoDe(15).honra).toBe("prata");
    expect(posicaoDe(30).honra).toBe("ouro");
  });
});

describe("o paragon", () => {
  /**
   * ═══ DEPOIS DO TOPO, A ESCADA NÃO ACABA ═══
   *
   * "Gume +1", "Gume +2". É o Paragon do Diablo: quem chegou ao fim continua tendo o que
   * fazer, e o app não precisa inventar um degrau novo a cada dois anos.
   */
  it("cada 25 leituras depois do Gume vale uma estrela", () => {
    expect(posicaoDe(500).estrelas).toBe(0);
    expect(posicaoDe(524).estrelas).toBe(0);
    expect(posicaoDe(525).estrelas).toBe(1);
    expect(posicaoDe(550).estrelas).toBe(2);
    expect(posicaoDe(1000).estrelas).toBe(20);
  });

  it("o nome sai com o mais, e nunca com vinte estrelinhas desenhadas", () => {
    expect(nomeCompleto(posicaoDe(500))).toBe("Gume");
    expect(nomeCompleto(posicaoDe(550))).toBe("Gume +2");
    expect(nomeCompleto(posicaoDe(30))).toBe("Ouro");
  });

  /**
   * No topo, a barra passa a medir a distância até a PRÓXIMA ESTRELA — e não fica cheia
   * e parada para sempre. Uma barra que nunca mais se move zomba de quem chegou.
   */
  it("no topo, a barra mede a próxima estrela", () => {
    const p = posicaoDe(510);
    expect(p.honra).toBe("gume");
    expect(p.proxima).toBeNull();
    expect(p.faltam).toBe(15); // 525 - 510
    expect(p.fracao).toBeCloseTo(10 / 25);
  });

  it("quem está no topo e não tem estrela ainda vê a barra vazia, e não cheia", () => {
    expect(posicaoDe(500).fracao).toBe(0);
  });
});

describe("a barra", () => {
  it("enche do começo ao fim do degrau", () => {
    expect(posicaoDe(5).honra).toBe("bronze");
    expect(posicaoDe(5).fracao).toBe(0);
    expect(posicaoDe(10).fracao).toBeCloseTo(0.5);
    expect(posicaoDe(15).honra).toBe("prata");
  });

  it("nunca sai de 0 a 1, em nenhum número", () => {
    for (let n = 0; n <= 3000; n += 7) {
      const f = posicaoDe(n).fracao;
      expect(f, `com ${n}`).toBeGreaterThanOrEqual(0);
      expect(f, `com ${n}`).toBeLessThanOrEqual(1);
    }
  });

  it("número quebrado ou negativo não quebra a escada", () => {
    expect(posicaoDe(-4).honra).toBe("ferro");
    expect(posicaoDe(7.9).quantas).toBe(7);
  });
});

describe("a voz", () => {
  it("toda honra tem um nome que uma pessoa lê", () => {
    for (const h of escada()) {
      const nome = NOME[h as Honra];
      expect(nome).toBeTruthy();
      expect(nome, `"${nome}" tem cara de nome de variável`).not.toMatch(/_|^[a-z]/);
    }
  });

  /**
   * ═══ NADA AQUI É COPIADO DO LEAGUE OF LEGENDS ═══
   *
   * "Mestre", "Grão-Mestre" e "Desafiante" são LoL, e não dizem nada sobre ler. E a
   * palavra "elo" também saiu: o Gume não é decalque de ninguém.
   */
  it("nenhuma honra é copiada do League of Legends", () => {
    const nomes = HONRAS.map((h) => NOME[h as Honra].toLowerCase());
    for (const proibido of ["mestre", "grão-mestre", "desafiante", "challenger", "elo"]) {
      expect(nomes, `"${proibido}" é LoL, e não diz nada sobre ler`).not.toContain(proibido);
    }
  });
});

describe("a moldura da cara mostra a honra", () => {
  const semApoio = { apoia: false, moldura: null };

  it("é a honra da pessoa, com a estrela do topo junto", () => {
    expect(coroaDe(posicaoDe(300), semApoio)).toEqual({ honra: "lamina", estrelas: 0 });
    expect(coroaDe(posicaoDe(575), semApoio)).toEqual({ honra: "gume", estrelas: 3 });
  });

  /**
   * ═══ O APOIO É A ÚNICA COISA QUE PASSA NA FRENTE ═══
   *
   * E ele não COMPETE com a honra: substitui. A moldura de apoiador não diz quanto você
   * leu, diz que você paga a conta do servidor. É outra coisa, e não um degrau acima do
   * Gume.
   */
  it("quem apoia e escolheu a moldura de apoiador usa a de apoiador", () => {
    expect(coroaDe(posicaoDe(1000), { apoia: true, moldura: "apoiador" })).toEqual({ apoiador: true });
  });

  /**
   * A coluna guarda a ESCOLHA, e não o DIREITO. Quem para de apoiar perde a moldura
   * sozinho, e ninguém precisa passar limpando escolha de quem cancelou.
   */
  it("quem escolheu a moldura de apoiador e parou de apoiar volta para a honra", () => {
    expect(coroaDe(posicaoDe(15), { apoia: false, moldura: "apoiador" })).toEqual({
      honra: "prata",
      estrelas: 0,
    });
  });

  it("quem apoia mas não escolheu continua mostrando a honra", () => {
    expect(coroaDe(posicaoDe(15), { apoia: true, moldura: null })).toEqual({
      honra: "prata",
      estrelas: 0,
    });
  });

  it("quem não leu nada tem a moldura do Ferro, e não fica sem moldura", () => {
    expect(coroaDe(posicaoDe(0), semApoio)).toEqual({ honra: "ferro", estrelas: 0 });
  });
});

/**
 * ════════════════════════════════════════════════════════════════════
 *  DOIS CAMINHOS, UMA ESCADA. "Quantidade de livros e de página — isso premia
 *  quem lê muitos livros pequenos e quem lê alguns livros grandes." Ver
 *  melhorPosicao(), em lib/honras.ts, e ai/DECISIONS.md.
 * ════════════════════════════════════════════════════════════════════
 */
describe("a régua de páginas", () => {
  it("cada degrau custa 300 páginas por leitura — a mesma proporção, a régua toda", () => {
    for (const h of escada()) {
      if (piso(h) === 0) continue;
      expect(pisoEmPaginas(h)).toBe(piso(h) * 300);
    }
  });

  it("posicaoPorPaginas sobe do mesmo jeito que posicaoDe, só que em páginas", () => {
    expect(posicaoPorPaginas(0).honra).toBe("ferro");
    expect(posicaoPorPaginas(1499).honra).toBe("ferro");
    expect(posicaoPorPaginas(1500).honra).toBe("bronze");
    expect(posicaoPorPaginas(150_000).honra).toBe("gume");
  });

  it("o paragon de páginas é o mesmo múltiplo do de leituras", () => {
    expect(paragonEmPaginas()).toBe(paragonEmLeituras() * 300);
  });
});

describe("melhorPosicao: a régua que colocar a pessoa mais longe", () => {
  it("poucas leituras de livros gigantes vencem muitas leituras de livros curtos", () => {
    // 3 leituras não chegam ao Bronze (5) — mas 45.000 páginas já é Diamante.
    const p = melhorPosicao(3, 45_000);
    expect(p.via).toBe("paginas");
    expect(p.honra).toBe("diamante");
    expect(p.quantas).toBe(45_000);
  });

  it("quem lê muitos livros curtos continua subindo pela régua de sempre", () => {
    // 60 leituras é Platina — bem mais do que as 3.000 páginas (curtas) dariam sozinhas.
    const p = melhorPosicao(60, 3000);
    expect(p.via).toBe("livros");
    expect(p.honra).toBe("platina");
    expect(p.quantas).toBe(60);
  });

  it("em empate exato, o caminho de livros é quem assina — mas o resultado é o mesmo", () => {
    // 500 leituras = Gume. 150.000 páginas TAMBÉM é Gume, exatamente no mesmo piso.
    const p = melhorPosicao(500, 150_000);
    expect(p.honra).toBe("gume");
    expect(p.estrelas).toBe(0);
  });

  it("uma estrela por páginas conta igual a uma estrela por leituras", () => {
    // 525 leituras é Gume +1. 157.500 páginas (150.000 + 7.500) também é.
    const porLivros = melhorPosicao(525, 0);
    const porPaginas = melhorPosicao(0, 157_500);
    expect(porLivros.estrelas).toBe(1);
    expect(porPaginas.estrelas).toBe(1);
    expect(porPaginas.via).toBe("paginas");
  });

  it("carrega os dois números crus, não só o vencedor", () => {
    const p = melhorPosicao(12, 45_000);
    expect(p.livros).toBe(12);
    expect(p.paginas).toBe(45_000);
  });

  it("número quebrado ou negativo não quebra nenhuma das duas réguas", () => {
    const p = melhorPosicao(-3, -100);
    expect(p.honra).toBe("ferro");
    expect(p.livros).toBe(0);
    expect(p.paginas).toBe(0);
  });
});
