import type { Leitura } from "@/lib/leituras";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O QUE A GAVETA DE "QUANDO VOCÊ LEU" MOSTRA SEM SER ABERTA.
 *
 *  A gaveta EXIGE um resumo, e o motivo está escrito nela: sem ele, a pessoa
 *  precisa abrir para descobrir se valia a pena abrir, e abrir para descobrir é
 *  fazer ela pagar para ver.
 *
 *  Então o resumo é a própria resposta que ela iria procurar lá dentro — o ano em
 *  que leu. Com isso, quase nunca há motivo para abrir: a gaveta informa fechada,
 *  e só se abre para CORRIGIR, que é coisa de uma vez na vida.
 *
 *  Mora aqui, e não dentro do componente, porque é texto de tela e o texto de tela
 *  deste projeto é varrido por lib/voice.test.ts. Um resumo que falasse como
 *  desenvolvedor quebraria o build, e é para isso que a varredura existe.
 * ════════════════════════════════════════════════════════════════════
 */
export function resumoDasLeituras(leituras: Leitura[]): string {
  // Mais de uma leitura: a resposta que interessa passa a ser QUANTAS foram, porque
  // aí a pessoa releu, e reler é o fato.
  if (leituras.length > 1) return `${leituras.length} leituras`;

  const uma = leituras[0];
  if (!uma) return "";

  /**
   * O valor já chega como "2019" ou "2019-03-14": o FORMATO diz a precisão (ver
   * lib/datas.ts), então os quatro primeiros são sempre o ano, nos dois casos. O
   * resumo fala em ANO de propósito, mesmo quando o dia é conhecido: ele é uma
   * etiqueta, e não a ficha.
   */
  const fim = uma.terminou ?? uma.abandonou;
  if (fim) return `${uma.abandonou ? "larguei" : "terminei"} em ${fim.slice(0, 4)}`;
  if (uma.comecou) return `comecei em ${uma.comecou.slice(0, 4)}`;

  // Uma leitura registrada sem data nenhuma é legítima: dá para não lembrar.
  return "sem data";
}
