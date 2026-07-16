import { describe, expect, it } from "vitest";
import { APOIADOR, DEGRAU, distancia, ehCinza, luz, matiz } from "./paleta";
import { HONRAS } from "./honras";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A MOLDURA TEM QUE DIZER O QUE ELA É, DE RELANCE.
 *
 *  ═══ O BUG QUE ESTE ARQUIVO EXISTE POR CAUSA DE ═══
 *
 *  A moldura de apoiador era verde-água (#7DD3C0, a cor da marca). Parecia bonito, e na
 *  tela dava um empate de três:
 *
 *      platina    #4FA39A   verde-água escuro
 *      esmeralda  #2E9E63   verde
 *      apoiador   #7DD3C0   verde-água claro
 *
 *  Três anéis verdes na mesma cara. E aí a moldura para de dizer alguma coisa: a pessoa
 *  vê um anel esverdeado e não sabe se aquilo é uma HONRA ou um APOIO — que são as duas
 *  únicas coisas que a moldura existe para distinguir.
 *
 *  **Nenhum teste avisou.** As cores estavam soltas dentro de um componente, e ninguém
 *  mede a distância entre duas cores olhando um `.tsx`. Só apareceu porque uma pessoa
 *  olhou para a tela.
 *
 *  Agora a paleta é dado, e a distância é medida.
 * ════════════════════════════════════════════════════════════════════
 */
describe("a paleta da moldura", () => {
  it("tem uma cor por degrau da escada", () => {
    expect(DEGRAU).toHaveLength(HONRAS.length);
  });

  /**
   * ════════════════════════════════════════════════════════════════════
   *  ═══ TODOS OS PARES. E ESTE TESTE JÁ MEDIU A COISA ERRADA. ═══
   *
   *  A primeira versão comparava só degraus **vizinhos**. E as três colisões estavam
   *  entre os distantes:
   *
   *      bronze (22°)   x  navalha  (15°)  =  7°   ← a mesma cor
   *      ouro   (46°)   x  gume     (43°)  =  3°   ← a mesma cor
   *      prata  (208°)  x  diamante (214°) =  6°   ← a mesma cor
   *
   *  Três pares idênticos na escada, e o teste passava sorrindo: **ele nunca comparou o
   *  2º com o 9º.**
   *
   *  Uma escada de dez degraus tem **45 pares**, e não 9. Um teste que olha só para o
   *  vizinho não está medindo uma paleta: está medindo uma fila.
   *
   *  E o estrago é o pior possível: a moldura existe para dizer, de relance, o que uma
   *  pessoa é. Se o 2º e o 9º degrau têm a mesma cara, ela deixa de dizer qualquer coisa
   *  — e o Bronze e a Navalha viram a mesma pessoa.
   * ════════════════════════════════════════════════════════════════════
   */
  it("nenhum degrau tem a cor de outro, e são 45 pares", () => {
    const colisoes: string[] = [];
    let pares = 0;

    const TODAS = [
      ...DEGRAU.map((t, i) => ({
        nome: `${HONRAS[i]}`,
        cor: t.de,
      })),
      { nome: "APOIADOR", cor: APOIADOR.de },
    ];

    for (let i = 0; i < TODAS.length; i++) {
      for (let j = i + 1; j < TODAS.length; j++) {
        const a = TODAS[i]!;
        const b = TODAS[j]!;
        pares++;

        /**
         * ═══ DUAS RÉGUAS, PORQUE SÃO DUAS FAMÍLIAS ═══
         *
         * Cinza não tem matiz: ele é ausência de cor, e não colide com cor nenhuma. O que
         * distingue dois cinzas é a LUZ.
         *
         * Ferro (39%), Prata (76%) e Gume (95%) são três cinzas, e são o esqueleto da
         * escada: grafite, prata, e o branco do fio.
         */
        if (ehCinza(a.cor) && ehCinza(b.cor)) {
          /**
           * ═══ VINTE E CINCO, E NÃO DEZOITO ═══
           *
           * Era 18, e ele aprovou uma Prata a 76% de luz ao lado de um Gume a 95%. Numa
           * planilha são dezenove pontos; num anel de dois pixels sobre um fundo preto
           * são a mesma cor, e a pessoa que olhou disse isso na hora.
           *
           * **Um limiar que aprova o que a pessoa vê como igual não é um limiar: é uma
           * desculpa.**
           */
          const d = Math.abs(luz(a.cor) - luz(b.cor));
          if (d < 25) {
            colisoes.push(
              `${a.nome} (${a.cor}) e ${b.nome} (${b.cor}) são dois cinzas a ${Math.round(d)} ` +
                "de luz: na tela são o mesmo anel",
            );
          }
          continue;
        }

        // Um cinza e uma cor nunca se confundem.
        if (ehCinza(a.cor) || ehCinza(b.cor)) continue;

        const d = distancia(matiz(a.cor), matiz(b.cor));
        if (d < 30) {
          colisoes.push(
            `${a.nome} (${a.cor}) e ${b.nome} (${b.cor}) estão a ${Math.round(d)}°: ` +
              "na tela os dois viram o mesmo anel",
          );
        }
      }
    }

    // Dez degraus + o apoiador = onze coisas = 55 pares. Se este número mudar sem
    // ninguém mexer na paleta, a varredura quebrou e o teste parou de olhar.
    expect(pares).toBe(55);
    expect(colisoes).toEqual([]);
  });

  /**
   * ═══ E O APOIO NÃO PODE SER A COR DA MARCA ═══
   *
   * Era. O accent do Gume é #7DD3C0 (167°) e a moldura era exatamente ele.
   *
   * A cor da marca quer dizer "o app está falando com você". Um anel dessa cor numa cara
   * dizia isso sobre uma PESSOA, o que não quer dizer nada.
   */
  it("o apoiador não é a cor da marca", () => {
    const ACCENT = 167; // #7DD3C0, o verde-água do app
    expect(distancia(matiz(APOIADOR.de), ACCENT)).toBeGreaterThanOrEqual(60);
  });

  /**
   * O apoio é ROSA, e é a mesma cor de "Quem faz" (--color-colaborar, #E8709F).
   *
   * A coincidência não é coincidência: **apoiar é contribuir.** Quem paga a conta do
   * servidor está fazendo pelo Gume o mesmo que quem conserta uma ficha.
   */
  it("o apoiador é a cor de quem constrói o Gume", () => {
    expect(distancia(matiz(APOIADOR.de), matiz("#e8709f"))).toBeLessThan(6);
  });

  /**
   * ═══ O GUME É O MAIS CLARO DE TUDO ═══
   *
   * Ele era DOURADO, e o ouro já era dourado: três graus de diferença, e o último degrau
   * da escada parecia o quarto.
   *
   * Agora ele é o branco do fio — o brilho de uma lâmina afiada contra a luz, que é
   * literalmente o que a palavra quer dizer. E isso faz dele o topo sem precisar de
   * brilho a mais nem de moldura diferente: **ele só é mais claro que todo o resto.**
   *
   * ═══ E ISSO NÃO BASTOU ═══
   *
   * "A última honra (Gume e Katana) está muito parecida com a prata."
   *
   * Trinta e cinco pontos de luz separam os dois, contra um limiar de vinte e cinco: este
   * teste passava com folga. E o olho, que é o juiz, discordava.
   *
   * Porque o limiar mede a coisa errada. Os dois são ACROMÁTICOS, e num anel fino sobre
   * fundo preto o olho não tem matiz nenhum para segurar: ele lê "cinza claro" nos dois.
   *
   * Subir mais a luz era impossível — o Gume já era quase branco, e o caminho de cima
   * tinha acabado. Então o topo deixou de ser "o mais claro" e passou a ser **o que
   * brilha**: uma diferença de NATUREZA, e não de grau. O teste da aura está logo abaixo.
   */
  it("o Gume é o degrau mais claro da escada", () => {
    const gume = DEGRAU[DEGRAU.length - 1]!.de;

    for (let i = 0; i < DEGRAU.length - 1; i++) {
      expect(
        luz(gume),
        `${HONRAS[i]} (${DEGRAU[i]!.de}) é mais claro que o Gume`,
      ).toBeGreaterThan(luz(DEGRAU[i]!.de));
    }
  });

  /**
   * ════════════════════════════════════════════════════════════════════
   *  A AURA É DO TOPO, E SÓ DELE.
   *
   *  Ser o mais claro não foi suficiente para separar o Gume da prata: dois acromáticos
   *  num anel fino leem como a mesma coisa, por mais luz que os separe. O topo passou a
   *  EMITIR luz — a única coisa na escada inteira que não é apenas "mais" do que a
   *  anterior.
   *
   *  ═══ E É POR ISSO QUE ELA TEM QUE SER ÚNICA ═══
   *
   *  Se dois degraus brilhassem, o brilho viraria uma ESCALA. E uma escala de brilho é um
   *  degrau novo escondido dentro do desenho: "a Navalha brilha um pouco, o Gume brilha
   *  muito" é uma segunda hierarquia rodando por baixo da primeira, que ninguém decidiu e
   *  que ninguém consegue ler.
   *
   *  A aura é binária. O topo tem; o resto não tem. É o que a mantém sendo uma diferença
   *  de natureza, e não mais um grau.
   * ════════════════════════════════════════════════════════════════════
   */
  it("o último degrau brilha", () => {
    const topo = DEGRAU[DEGRAU.length - 1]!;

    expect(
      topo.aura,
      "o topo da escada perdeu a aura. Sem ela ele volta a ser só um cinza mais claro que " +
        "a prata, e o olho não distingue os dois num anel fino.",
    ).toBeTruthy();
  });

  it("e é o único que brilha, porque brilho não pode virar escala", () => {
    const brilhantes = DEGRAU.map((t, i) => ({ i, aura: t.aura })).filter((x) => x.aura);

    expect(
      brilhantes.map((x) => x.i),
      "mais de um degrau ganhou aura. Aí o brilho vira uma escala, e uma escala de brilho é " +
        "uma segunda hierarquia rodando por baixo da primeira: ninguém decidiu, e ninguém lê.",
    ).toEqual([DEGRAU.length - 1]);

    // E o apoiador não brilha: ele não é um degrau, e não fica acima de nada.
    expect(
      APOIADOR.aura,
      "o apoiador ganhou aura. Ele não é um degrau, e a aura é a marca do topo da escada: " +
        "com ela, quem paga a conta passa a parecer o maior leitor do Gume.",
    ).toBeFalsy();
  });

  it("o brilho é do mesmo matiz do anel: um anel bicolor vira um adesivo", () => {
    for (const t of [...DEGRAU, APOIADOR]) {
      const n = parseInt(t.de.replace("#", ""), 16);
      const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      if (Math.max(r, g, b) - Math.min(r, g, b) < 12) continue; // cinza

      expect(
        distancia(matiz(t.de), matiz(t.brilho)),
        `${t.de} e o brilho ${t.brilho} são cores diferentes, e não dois tons da mesma`,
      ).toBeLessThan(35);
    }
  });
});
