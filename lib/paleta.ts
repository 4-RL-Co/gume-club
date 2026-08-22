/**
 * ════════════════════════════════════════════════════════════════════
 *  AS CORES DA MOLDURA. Uma por degrau, mais a do apoio.
 *
 *  ═══ POR QUE ELAS MORAM AQUI, E NÃO DENTRO DO COMPONENTE ═══
 *
 *  Porque elas precisam de TESTE.
 *
 *  A moldura de apoiador era verde-água (a cor da marca). Parecia bonito, e na tela dava
 *  um empate de três:
 *
 *      platina    #4FA39A   verde-água escuro
 *      esmeralda  #2E9E63   verde
 *      apoiador   #7DD3C0   verde-água claro
 *
 *  Três anéis verdes disputando a mesma cara. E aí a moldura para de dizer alguma coisa:
 *  a pessoa vê um anel esverdeado e não sabe se aquilo é uma honra ou um apoio — que são
 *  as duas únicas coisas que a moldura existe para distinguir.
 *
 *  **Isso só apareceu porque alguém olhou.** Nenhum teste avisou, e nenhum teste podia:
 *  as cores estavam soltas dentro de um componente, e ninguém mede a distância entre duas
 *  cores olhando um `.tsx`.
 *
 *  Aqui elas são dados, e `lib/paleta.test.ts` mede.
 *
 *  ═══ E O PRIMEIRO TESTE MEDIA A COISA ERRADA ═══
 *
 *  Ele comparava só degraus VIZINHOS. E as colisões estavam entre os distantes:
 *
 *      bronze (22°)  x  navalha (15°)   =   7°   ← a mesma cor
 *      ouro   (46°)  x  gume    (43°)   =   3°   ← a mesma cor
 *      prata (208°)  x  diamante (214°) =   6°   ← a mesma cor
 *
 *  Três pares idênticos, e o teste passava sorrindo: ele nunca comparou o 2º com o 9º.
 *
 *  Uma escada de dez degraus tem 45 pares, e não 9. **Um teste que olha só para o vizinho
 *  não está medindo uma paleta: está medindo uma fila.**
 * ════════════════════════════════════════════════════════════════════
 */

export type Tinta = {
  de: string;
  brilho: string;
  /**
   * ════════════════════════════════════════════════════════════════════
   *  A AURA. O último degrau é o único que EMITE LUZ.
   *
   *  ═══ O BUG, E ELE É O MESMO DE ANTES, COM OUTRA ROUPA ═══
   *
   *  "A última honra (Gume e Katana) está muito parecida com a prata."
   *
   *  E o teste da paleta aprovava. Prata está em 61% de luz, Gume em 96%: trinta e cinco
   *  pontos, contra um limiar de vinte e cinco. Passa com folga.
   *
   *  Só que o limiar mede a coisa errada. Num ANEL FINO sobre um fundo preto, cinza-claro
   *  e branco leem como a mesma coisa — não porque a luz seja parecida, mas porque **os
   *  dois são acromáticos**. Não há matiz para o olho segurar. Ele vê "cinza claro" nos
   *  dois, e pronto.
   *
   *  É a terceira vez que a mesma frase precisa ser escrita neste arquivo: **um limiar que
   *  aprova o que a pessoa vê como igual não é um limiar, é uma desculpa.** Só que desta vez
   *  a solução não é subir o número. Subir mais a luz do Gume é impossível: ele já é quase
   *  branco. O caminho de cima acabou.
   *
   *  ═══ ENTÃO O TOPO PARA DE SER "O MAIS CLARO" E PASSA A SER "O QUE BRILHA" ═══
   *
   *  A diferença deixa de ser de GRAU e passa a ser de NATUREZA. Nenhum outro degrau emite
   *  luz. O último emite — e essa é a única coisa na escada inteira que não é apenas "mais"
   *  do que a anterior.
   *
   *  E é o significado da palavra: *gume* é o fio da lâmina, e o fio de uma lâmina afiada é
   *  a única parte dela que devolve a luz. Katana, do outro lado, é a mesma coisa.
   *
   *  ═══ POR QUE ISTO NÃO CONTAMINA O RESTO ═══
   *
   *  Porque é **um só**. Se dois degraus brilhassem, o brilho viraria uma escala — e uma
   *  escala de brilho é um degrau novo escondido dentro do desenho. A aura é binária:
   *  o topo tem, e o resto não tem. `lib/paleta.test.ts` quebra o build se um segundo
   *  degrau ganhar uma.
   * ════════════════════════════════════════════════════════════════════
   */
  aura?: string;
};

/**
 * ═══ AS DUAS ESCADAS COMPARTILHAM A PALETA, DEGRAU A DEGRAU ═══
 *
 * O 3º degrau da literatura (Prata) e o 3º dos quadrinhos (Ronin) têm a MESMA cor. Não é
 * economia: é a única forma de as duas serem legíveis lado a lado.
 *
 * A moldura diz "que altura", e o NOME diz "de qual escada". Se a cor também mudasse
 * entre as escadas, seriam vinte cores para decorar — e ninguém decora vinte cores.
 *
 * `de` é a cor do anel; `brilho` é o arco que passa por cima. Dois tons da MESMA cor: um
 * anel bicolor vira um adesivo.
 */
export const DEGRAU: Tinta[] = [
  /**
   * ═══ TRÊS ACROMÁTICOS, E ELES SÃO O ESQUELETO DA ESCADA ═══
   *
   * Ferro é grafite escuro. Prata é cinza claro. **Gume é o branco do fio.**
   *
   * O Gume era DOURADO (#D4A017) — e o ouro já era dourado (#C9A227). Três graus de
   * diferença: eram a mesma cor, e o último degrau da escada parecia o quarto.
   *
   * Agora ele é o brilho de uma lâmina afiada contra a luz, que é literalmente o que a
   * palavra quer dizer.
   *
   * ═══ E "SER O MAIS CLARO" NÃO BASTOU ═══
   *
   * Esta nota dizia que ele era o topo "sem precisar de brilho a mais nem de moldura
   * diferente: ele só é mais claro que todo o resto". Estava errado, e a prova é que a
   * primeira pessoa que olhou disse "o Gume está muito parecido com a prata".
   *
   * Trinta e cinco pontos de luz separam os dois, e não adianta: os dois são ACROMÁTICOS,
   * e num anel fino sobre fundo preto o olho não tem matiz nenhum para segurar. Ele lê
   * "cinza claro" nos dois.
   *
   * Por isso o topo ganhou uma AURA, e é o único que tem. Ele deixou de ser "mais claro" e
   * passou a ser "o que brilha" — uma diferença de natureza, e não de grau. Ver o tipo
   * `Tinta`, lá em cima.
   *
   * Os três se distinguem pela LUZ, e não pelo matiz — porque cinza não tem matiz. É a
   * única família onde a régua é outra, e lib/paleta.test.ts sabe disso.
   *
   * ═══ E A PRIMEIRA VEZ QUE ELES FORAM DESENHADOS, DUAS ERAM A MESMA COR ═══
   *
   * Ferro estava em 39% de luz, Prata em 76%, Gume em 95%. Dezenove pontos entre a Prata
   * e o Gume — e num anel de dois pixels sobre um fundo preto, cinza-claro e branco são a
   * mesma coisa.
   *
   * O teste deixou passar porque o limiar dele era 18. **Um limiar que aprova o que a
   * pessoa vê como igual não é um limiar: é uma desculpa.** Ele subiu para 25.
   *
   * Agora são 32%, 61% e 96%: grafite, cinza, branco. Vinte e nove pontos e trinta e
   * cinco.
   */
  { de: "#4f5256", brilho: "#8b8f94" }, //  1  ferro     · aprendiz   — grafite
  { de: "#8d503a", brilho: "#bf9a8d" }, //  2  bronze    · discípulo  ·  16°
  { de: "#979ba0", brilho: "#d2d5d8" }, //  3  prata     · ronin      — cinza
  { de: "#c9a926", brilho: "#dfd095" }, //  4  ouro      · samurai    ·  48°
  { de: "#4ea9bc", brilho: "#b6d2d8" }, //  5  platina   · kenshi     · 190°
  { de: "#2e9e5d", brilho: "#85cca2" }, //  6  esmeralda · sensei     · 145°
  { de: "#5050d7", brilho: "#c2c2ea" }, //  7  diamante  · shogun     · 240°
  /**
   * ═══ A LÂMINA MUDOU DE MATIZ QUANDO O ACCENT VIROU LILÁS ═══
   *
   * Era #9D5ED4 (272°, roxo) — e o accent do Gume virou lilás, matiz 308°
   * (era verde-água, 167°). A só 36° de distância, os dois liam quase como
   * a mesma cor num anel fino, contra um limiar de 30° que já é apertado
   * para essa régua. "as cores do nosso site podem ser as mesmas cores do
   * catppuccino puxando uns botões meio pro lilaz" — o dono, pedindo o
   * accent lilás; perguntado se podia mexer nos degraus pra abrir espaço,
   * a resposta foi sim.
   *
   * A Lâmina foi para 96°, verde-limão: o único vão com folga de sobra
   * (48° do ouro, 49° do esmeralda) — a faixa roxo-rosa inteira (240° a
   * 336°) já estava ocupada por diamante, o accent novo e a navalha, sem
   * espaço pra encaixar mais um degrau a 30° de todos. A Navalha (9º
   * degrau, logo abaixo) não precisou se mexer: a 304°, ela fica a 33° do
   * accent novo — folgada.
   */
  { de: "#8dd45e", brilho: "#d8ebcc" }, //  8  lâmina    · oni        · 96°
  { de: "#d345ca", brilho: "#e6b7e3" }, //  9  navalha   · tengu      · 304°
  /**
   * O TOPO, E O ÚNICO COM AURA.
   *
   * `de` subiu para branco puro, e ele emite: um halo frio, quase azul, que é como uma
   * lâmina afiada devolve a luz de verdade. Um branco quente pareceria ouro velho, e ouro
   * já é o quarto degrau.
   */
  { de: "#ffffff", brilho: "#ffffff", aura: "#dff2ff" }, // 10  gume · katana — o fio
];

/**
 * ═══ O APOIO É ROSA ═══
 *
 * #E8709F — a mesma cor de "Quem faz" (`--color-colaborar`), e a coincidência não é
 * coincidência: **apoiar é contribuir.** Quem paga a conta do servidor está fazendo pelo
 * Gume o mesmo que quem conserta uma ficha, com outro tipo de trabalho.
 *
 * E ela continua **não sendo um degrau**: não é melhor que o Gume, não fica acima de
 * nada, e não diz quanto você leu.
 */
export const APOIADOR: Tinta = { de: "#e8709f", brilho: "#ffd3e5" };

/** O matiz de uma cor, em graus. É por ele que se mede se duas cores colidem. */
export function matiz(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  if (d === 0) return 0; // cinza: não tem matiz, e não colide com ninguém

  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;

  return ((h * 60) % 360 + 360) % 360;
}

/** A distância entre dois matizes, no círculo. 350° e 10° estão a vinte graus. */
export function distancia(a: number, b: number): number {
  const bruta = Math.abs(a - b);
  return Math.min(bruta, 360 - bruta);
}

/**
 * Esta cor é CINZA? Isto é, ela não tem matiz nenhum.
 *
 * Cinza não colide com cor: ele é ausência de cor. O que distingue dois cinzas é a LUZ,
 * e não o matiz — e é por isso que a régua deles é outra.
 *
 * A conta é a distância entre o canal mais forte e o mais fraco. `#5F6368` tem 9 de
 * distância e é cinza; `#4EA9BC` tem 110 e é uma cor.
 */
export function ehCinza(hex: string): boolean {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return Math.max(r, g, b) - Math.min(r, g, b) < 14;
}

/** A luz de uma cor, de 0 a 100. É por ela que se distinguem dois cinzas. */
export function luz(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return ((Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255) * 100;
}
