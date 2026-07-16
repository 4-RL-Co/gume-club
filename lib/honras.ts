/**
 * ════════════════════════════════════════════════════════════════════
 *  AS HONRAS. Uma escada só, e um topo que não é o fim.
 *
 *  ═══ NÃO SE CHAMA MAIS "ELO" ═══
 *
 *  "Elo" é League of Legends, e o Gume não é um decalque de ninguém. **Honra** é uma
 *  palavra portuguesa, e ela diz o que a coisa é: um reconhecimento pelo que você leu na
 *  vida, e não uma posição numa fila.
 *
 *  ═══ UMA ESCADA, E NÃO DUAS ═══
 *
 *  Antes havia duas: uma de literatura (Ferro → … → Gume) e uma de quadrinhos (Aprendiz →
 *  … → Katana), cada uma com a régua dela, porque um volume de mangá se lê num quarto do
 *  tempo de um romance.
 *
 *  Era honesto e era complicado. Duas barras no perfil, dois vocabulários, e uma linha
 *  cinzenta no meio: uma HQ marcada como "brochura" caía na escada errada, e a pessoa não
 *  entendia por quê. A separação resolvia um problema de JUSTIÇA que quase ninguém sentia,
 *  e criava um problema de CLAREZA que todo mundo via.
 *
 *  Então virou uma só, a de metal e pedra, terminando no fio: o Gume. Tudo conta junto:
 *  um romance é uma leitura, uma HQ é uma leitura, e **cada volume de mangá é uma
 *  leitura**. Sim, isso deixa a honra mais fácil de subir para quem lê mangá. Tudo bem:
 *  ler quinhentas obras, do tipo que for, é uma vida de leitor, e uma vida de leitor é
 *  digna de mérito. A honra não é um prêmio de dificuldade, é um retrato de quanto você
 *  leu.
 *
 *  ═══ O TOPO É ALCANÇÁVEL, E DEPOIS DELE A ESCADA NÃO ACABA ═══
 *
 *  Mil leituras era um número que quase ninguém alcança numa vida. Uma escada cujo último
 *  degrau é inatingível não é uma escada: é um pôster.
 *
 *  O topo agora são **500 leituras** — uma vida de leitor de verdade, doze por ano por
 *  quarenta anos. E depois dele o Gume não para: vira **Gume +1, Gume +2, Gume +3**, um a
 *  cada 25 leituras, para sempre.
 *
 *  É o Paragon do Diablo, e a ideia é a mesma: quem chegou ao topo continua tendo o que
 *  fazer, sem que o app precise inventar um degrau novo a cada dois anos.
 * ════════════════════════════════════════════════════════════════════
 */

import { DEGRAU, type Tinta } from "@/lib/paleta";

/**
 * A escada, do Ferro ao Gume. Metal e pedra, terminando no fio.
 *
 * A chave é a que fica gravada no banco (`activities.honra`); o NOME que a pessoa lê está
 * em `NOME`, logo abaixo.
 */
export const HONRAS = [
  "ferro",
  "bronze",
  "prata",
  "ouro",
  "platina",
  "esmeralda",
  "diamante",
  "lamina",
  "navalha",
  "gume",
] as const;

export type Honra = (typeof HONRAS)[number];

/** O nome que a pessoa lê. Nunca a chave crua. */
export const NOME: Record<Honra, string> = {
  ferro: "Ferro",
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
  platina: "Platina",
  esmeralda: "Esmeralda",
  diamante: "Diamante",
  lamina: "Lâmina",
  navalha: "Navalha",
  gume: "Gume",
};

/**
 * ═══ OS PISOS ═══
 *
 * Quantas leituras é preciso ter para entrar em cada honra.
 *
 * Os degraus de baixo são CURTOS de propósito: cinco leituras e você sai do Ferro. O que
 * demora é o meio, e é assim que tem que ser.
 */
//               Ferro Bronze Prata Ouro Platina Esmeralda Diamante Lâmina Navalha Gume
const PISO = [0, 5, 15, 30, 60, 100, 150, 225, 325, 500];

/**
 * ═══ O PARAGON ═══
 *
 * Depois do topo, a cada tantas leituras a pessoa ganha um `+1`.
 *
 * Vinte e cinco por estrela. É mais ou menos dois anos de leitura para a maioria das
 * pessoas, e é de propósito: uma estrela que chega toda semana não é uma estrela, é um
 * contador.
 */
const PARAGON = 25;

/** A escada, do Ferro ao Gume. */
export function escada(): readonly Honra[] {
  return HONRAS;
}

/** O piso de uma honra. */
export function piso(honra: Honra): number {
  const i = (HONRAS as readonly string[]).indexOf(honra);
  if (i < 0) throw new Error(`"${honra}" não é uma honra`);
  return PISO[i]!;
}

export type Posicao = {
  honra: Honra;
  /** Quantas leituras a pessoa tem. */
  quantas: number;

  /**
   * As estrelas do topo. Zero para quem não chegou lá.
   *
   * "Gume +3" quer dizer 3 estrelas. Elas não têm teto, e é essa a graça: quem chegou ao
   * fim da escada continua tendo o que fazer, e o app não precisa inventar um degrau novo
   * a cada dois anos. É o Paragon do Diablo.
   */
  estrelas: number;

  /** A próxima honra, ou null se a pessoa já está no topo (aí o que vem é uma estrela). */
  proxima: Honra | null;

  /** Quantas leituras faltam para o próximo degrau — ou para a próxima estrela. */
  faltam: number;

  /** Quanto do degrau atual já foi andado, de 0 a 1. É a barra. */
  fracao: number;
};

/**
 * Onde a pessoa está.
 *
 * `quantas` é o número de leituras TERMINADAS na vida — livros, HQs e volumes de mangá,
 * tudo junto. Não é por ano, não zera, e não expira: é uma vida de leitor, e vida não tem
 * temporada.
 */
export function posicaoDe(quantas: number): Posicao {
  const n = Math.max(0, Math.floor(quantas));

  let i = 0;
  for (let k = 0; k < HONRAS.length; k++) {
    if (n >= PISO[k]!) i = k;
  }

  const honra = HONRAS[i]! as Honra;
  const noTopo = i === HONRAS.length - 1;

  if (!noTopo) {
    const daqui = PISO[i]!;
    const ate = PISO[i + 1]!;

    return {
      honra,
      quantas: n,
      estrelas: 0,
      proxima: HONRAS[i + 1]! as Honra,
      faltam: ate - n,
      fracao: (n - daqui) / (ate - daqui),
    };
  }

  /**
   * NO TOPO: as estrelas.
   *
   * A barra passa a medir a distância até a PRÓXIMA estrela, e não até um degrau que não
   * existe. Uma barra cheia e parada, para sempre, é uma barra que zomba de quem chegou.
   */
  const acima = n - PISO[i]!;
  const estrelas = Math.floor(acima / PARAGON);
  const dentro = acima % PARAGON;

  return {
    honra,
    quantas: n,
    estrelas,
    proxima: null,
    faltam: PARAGON - dentro,
    fracao: dentro / PARAGON,
  };
}

/**
 * O nome completo, com as estrelas. "Gume +3". "Prata".
 *
 * As estrelas viram um `+N`, e não N estrelinhas desenhadas: doze estrelinhas ao lado de
 * um nome viram uma constelação, e ninguém consegue contar. O número se lê de relance.
 */
export function nomeCompleto(p: Posicao): string {
  return p.estrelas > 0 ? `${NOME[p.honra]} +${p.estrelas}` : NOME[p.honra];
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  A MOLDURA DA CARA MOSTRA A HONRA. E, SE A PESSOA APOIA E ESCOLHEU, O APOIO.
 *
 *  ═══ A ÚNICA COISA QUE PASSA NA FRENTE DA HONRA ═══
 *
 *  A moldura de APOIADOR, e só se a pessoa escolher usá-la. Ela não é um degrau: não diz
 *  quanto você leu, diz que você paga a conta do servidor. É outra coisa, e por isso ela
 *  não compete com a honra: ela substitui.
 *
 *  E ela só vale se a pessoa REALMENTE apoia hoje. A coluna guarda a escolha, e não o
 *  direito: quem para de apoiar perde a moldura sozinho, sem ninguém precisar limpar
 *  nada.
 * ════════════════════════════════════════════════════════════════════
 */
export type Coroa = { honra: Honra; estrelas?: number } | { apoiador: true };

export function coroaDe(
  p: Posicao,
  { apoia, moldura }: { apoia: boolean; moldura: string | null },
): Coroa {
  if (apoia && moldura === "apoiador") return { apoiador: true };
  return { honra: p.honra, estrelas: p.estrelas };
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  O QUE A HONRA NÃO FAZ, E NÃO VAI FAZER.
 *
 *  1. **NÃO OLHA PARA O TEMPO.** Sem ofensiva, sem meta do ano, sem temporada, e ela
 *     NUNCA cai. Um app que faz o número descer quando você para de ler pune quem está
 *     de luto, doente ou com um filho recém-nascido. Vida não tem temporada.
 *
 *  2. **NÃO EXISTE PLACAR.** A honra mora no perfil e na moldura. Nenhuma lista ordena
 *     gente por quanto leu: isso é uma máquina de fazer gente mentir que leu.
 *
 *  3. **A NOTA NÃO CONTA.** Ler e odiar vale o mesmo que ler e adorar. Se "adorei"
 *     valesse mais, o app estaria comprando elogio.
 *
 *  4. **ABANDONAR NÃO PUNE.** Se abandonar custasse honra, ninguém mais largaria um
 *     livro ruim.
 *
 *  Ver lib/honras.regras.test.ts, que é quem defende as quatro.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * ════════════════════════════════════════════════════════════════════
 *  O LIVRO QUE TE FEZ SUBIR FICA MARCADO NA ESTANTE.
 *
 *  "Quando um livro te faz subir de honra, esse livro deve ficar marcado com uma moldura
 *  da cor da honra na sua estante."
 *
 *  O dado já existia: `activities.honra` guarda, desde sempre, a honra em que a pessoa
 *  ENTROU ao terminar aquele livro. É uma MEMÓRIA, e não uma contagem: a moldura não diz
 *  "você leu 60 livros", diz "foi este aqui que te levou à Platina". Ela não ordena
 *  ninguém contra ninguém e não some se você parar de ler.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * A tinta de uma honra, pelo NOME dela.
 *
 * O valor gravado no banco pode vir com o paragon colado ("gume+3"), porque é assim que
 * `degrauNovo` o escreve. O que interessa aqui é o degrau, e o degrau é o que vem antes
 * do `+`. O índice na escada é o índice na paleta (ver lib/paleta.ts).
 */
export function tintaDeHonra(gravado: string | null | undefined): Tinta | null {
  if (!gravado) return null;

  const nome = gravado.split("+")[0]!.trim().toLowerCase();
  const i = (HONRAS as readonly string[]).indexOf(nome);
  return i >= 0 ? DEGRAU[i] ?? null : null;
}

/** O nome de exibição de uma honra gravada. "gume+3" vira "Gume +3". */
export function nomeDaHonra(gravado: string | null | undefined): string | null {
  if (!gravado) return null;

  const [nome, estrelas] = gravado.split("+");
  const base = NOME[(nome ?? "").trim().toLowerCase() as Honra];
  if (!base) return null;

  return estrelas ? `${base} +${estrelas}` : base;
}
