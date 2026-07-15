/**
 * ════════════════════════════════════════════════════════════════════
 *  AS HONRAS. Duas escadas, dois vocabulários, e um topo que não é o fim.
 *
 *  ═══ NÃO SE CHAMA MAIS "ELO" ═══
 *
 *  "Elo" é League of Legends, e o Gume não é um decalque de ninguém. **Honra** é uma
 *  palavra portuguesa, e ela diz o que a coisa é: um reconhecimento pelo que você leu na
 *  vida, e não uma posição numa fila.
 *
 *  ═══ DOIS VOCABULÁRIOS, E NÃO DOIS NÚMEROS ═══
 *
 *  Antes, as duas escadas tinham os MESMOS nomes com números diferentes: "Ouro" na
 *  literatura eram 30 livros e "Ouro" nos quadrinhos eram 75 volumes.
 *
 *  Isso confunde na hora exata em que as duas aparecem lado a lado no perfil: duas
 *  palavras iguais, dois números diferentes, e ninguém sabe qual é qual.
 *
 *      LITERATURA    Ferro → Bronze → … → Lâmina → Navalha → GUME
 *      QUADRINHOS    Aprendiz → Discípulo → Ronin → … → Oni → Tengu → KATANA
 *
 *  A de livro é METAL E PEDRA, e termina no fio: o Gume.
 *  A de quadrinho é o DOJÔ, e termina na lâmina inteira: a Katana.
 *
 *  As duas terminam numa lâmina, e é de propósito. É o mesmo app.
 *
 *  ═══ O TOPO É ALCANÇÁVEL, E DEPOIS DELE A ESCADA NÃO ACABA ═══
 *
 *  Mil livros era um número que quase ninguém alcança numa vida. Uma escada cujo último
 *  degrau é inatingível não é uma escada: é um pôster.
 *
 *  O topo agora são **500 livros** — uma vida de leitor de verdade, doze por ano por
 *  quarenta anos. E depois dele o Gume não para: vira **Gume +1, Gume +2, Gume +3**, um
 *  a cada 25 livros, para sempre.
 *
 *  É o Paragon do Diablo, e a ideia é a mesma: quem chegou ao topo continua tendo o que
 *  fazer, sem que o app precise inventar um degrau novo a cada dois anos.
 * ════════════════════════════════════════════════════════════════════
 */

/** A forma de uma obra. Bate com o enum `forma_da_obra` da migration 0041. */
import { DEGRAU, type Tinta } from "@/lib/paleta";

export type Forma = "livro" | "quadrinho";

/**
 * A chave de uma honra. Ela é ÚNICA entre as duas escadas — `ouro` é de livro, `ronin` é
 * de quadrinho, e nunca há como confundir uma com a outra num banco de dados.
 */
export const HONRAS = {
  livro: [
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
  ],
  quadrinho: [
    "aprendiz",
    "discipulo",
    "ronin",
    "samurai",
    "kenshi",
    "sensei",
    "shogun",
    "oni",
    "tengu",
    "katana",
  ],
} as const;

export type HonraDeLivro = (typeof HONRAS)["livro"][number];
export type HonraDeQuadrinho = (typeof HONRAS)["quadrinho"][number];
export type Honra = HonraDeLivro | HonraDeQuadrinho;

/** O nome que a pessoa lê. Nunca a chave crua. */
export const NOME: Record<Honra, string> = {
  // ── literatura: metal e pedra, terminando no fio
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

  // ── quadrinhos: o dojô, terminando na lâmina inteira
  aprendiz: "Aprendiz",
  discipulo: "Discípulo",
  ronin: "Ronin",
  samurai: "Samurai",
  kenshi: "Kenshi",
  sensei: "Sensei",
  shogun: "Shogun",
  oni: "Oni",
  tengu: "Tengu",
  katana: "Katana",
};

/**
 * ═══ OS PISOS ═══
 *
 * Quantas leituras é preciso ter para entrar em cada honra.
 *
 * Os degraus de baixo são CURTOS de propósito: cinco livros e você sai do Ferro. O que
 * demora é o meio, e é assim que tem que ser.
 *
 * A escada de quadrinho pede mais volumes porque um volume de mangá tem umas 190 páginas
 * contra 320 de um romance, e se lê num quarto do tempo. Não é castigo: é a mesma régua,
 * medida na unidade certa.
 */
const PISO: Record<Forma, number[]> = {
  //     Ferro Bronze Prata Ouro Platina Esmeralda Diamante Lâmina Navalha Gume
  livro: [0, 5, 15, 30, 60, 100, 150, 225, 325, 500],

  //         Aprendiz Discípulo Ronin Samurai Kenshi Sensei Shogun Oni Tengu Katana
  quadrinho: [0, 12, 40, 75, 150, 250, 375, 560, 810, 1250],
};

/**
 * ═══ O PARAGON ═══
 *
 * Depois do topo, a cada tantas leituras a pessoa ganha um `+1`.
 *
 * Vinte e cinco livros por estrela. É mais ou menos dois anos de leitura para a maioria
 * das pessoas, e é de propósito: uma estrela que chega toda semana não é uma estrela, é
 * um contador.
 */
const PARAGON: Record<Forma, number> = {
  livro: 25,
  quadrinho: 60,
};

/** As honras de uma forma, do Ferro ao Gume. */
export function escadaDe(forma: Forma): readonly Honra[] {
  return HONRAS[forma];
}

/** O piso de uma honra. */
export function piso(forma: Forma, honra: Honra): number {
  const i = (HONRAS[forma] as readonly string[]).indexOf(honra);
  if (i < 0) throw new Error(`"${honra}" não é uma honra de ${forma}`);
  return PISO[forma][i]!;
}

export type Posicao = {
  forma: Forma;
  honra: Honra;
  /** Quantas leituras a pessoa tem nesta escada. */
  quantas: number;

  /**
   * As estrelas do topo. Zero para quem não chegou lá.
   *
   * "Gume +3" quer dizer 3 estrelas. Elas não têm teto, e é essa a graça: quem chegou ao
   * fim da escada continua tendo o que fazer, e o app não precisa inventar um degrau
   * novo a cada dois anos. É o Paragon do Diablo.
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
 * `quantas` é o número de leituras TERMINADAS na vida, naquela forma. Não é por ano, não
 * zera, e não expira: é uma vida de leitor, e vida não tem temporada.
 */
export function posicaoDe(forma: Forma, quantas: number): Posicao {
  const n = Math.max(0, Math.floor(quantas));
  const escada = HONRAS[forma];
  const pisos = PISO[forma];

  let i = 0;
  for (let k = 0; k < escada.length; k++) {
    if (n >= pisos[k]!) i = k;
  }

  const honra = escada[i]! as Honra;
  const noTopo = i === escada.length - 1;

  if (!noTopo) {
    const daqui = pisos[i]!;
    const ate = pisos[i + 1]!;

    return {
      forma,
      honra,
      quantas: n,
      estrelas: 0,
      proxima: escada[i + 1]! as Honra,
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
  const passo = PARAGON[forma];
  const acima = n - pisos[i]!;
  const estrelas = Math.floor(acima / passo);
  const dentro = acima % passo;

  return {
    forma,
    honra,
    quantas: n,
    estrelas,
    proxima: null,
    faltam: passo - dentro,
    fracao: dentro / passo,
  };
}

/**
 * O nome completo, com as estrelas. "Gume +3". "Katana +1". "Prata".
 *
 * As estrelas viram um `+N`, e não N estrelinhas desenhadas: doze estrelinhas ao lado de
 * um nome viram uma constelação, e ninguém consegue contar. O número se lê de relance.
 */
export function nomeCompleto(p: Posicao): string {
  return p.estrelas > 0 ? `${NOME[p.honra]} +${p.estrelas}` : NOME[p.honra];
}

/** Quão alto é isto? Só para comparar as duas escadas ENTRE SI, e nunca para exibir. */
export function altura(p: Posicao): number {
  const i = (HONRAS[p.forma] as readonly string[]).indexOf(p.honra);
  return i * 1000 + p.estrelas;
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  A MOLDURA DA CARA MOSTRA A HONRA MAIS ALTA. SEMPRE.
 *
 *  Uma pessoa tem duas honras (uma por escada) e **uma cara só**. Alguma das duas tem
 *  que ir para o anel, e a regra é: a mais alta.
 *
 *  ═══ POR QUE A MAIS ALTA, E NÃO A ESCOLHA DA PESSOA ═══
 *
 *  Deixar escolher parece mais gentil, e é pior. Quem leu 300 livros e 12 mangás
 *  escolheria mostrar o Aprendiz num dia de modéstia — e aí o anel deixa de dizer
 *  alguma coisa sobre a pessoa e passa a dizer alguma coisa sobre o humor dela.
 *
 *  Um sinal que depende de escolha não é um sinal: é um enfeite. E a moldura só vale a
 *  pena existir porque, olhando uma cara no feed, dá para saber o que aquela pessoa é.
 *
 *  ═══ E "MAIS ALTA" É POR DEGRAU, NUNCA PELO NÚMERO ═══
 *
 *  146 volumes de mangá (Samurai, o 4º degrau) não podem ganhar de 150 livros (Diamante,
 *  o 7º) só por serem quase o mesmo número. As duas escadas existem exatamente para isso
 *  não acontecer, e comparar pelo número cru desfaria as duas de uma vez.
 *
 *  ═══ A ÚNICA COISA QUE PASSA NA FRENTE ═══
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
  livro: Posicao,
  quadrinho: Posicao,
  { apoia, moldura }: { apoia: boolean; moldura: string | null },
): Coroa {
  if (apoia && moldura === "apoiador") return { apoiador: true };

  const maior = altura(livro) >= altura(quadrinho) ? livro : quadrinho;
  return { honra: maior.honra, estrelas: maior.estrelas };
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
 *  ENTROU ao terminar aquele livro. Estava gravado e não estava sendo mostrado em lugar
 *  nenhum — a estante não sabia que uma das capas dela era um marco.
 *
 *  ═══ POR QUE ISTO NÃO É UM PLACAR ═══
 *
 *  Porque é uma MEMÓRIA, e não uma contagem. A moldura não diz "você leu 60 livros": diz
 *  "foi este aqui que te levou à Platina". Ela não ordena ninguém contra ninguém, não
 *  aparece na estante dos outros como comparação, e não some se você parar de ler.
 *
 *  É a coisa que um app de leitura devia fazer e nenhum faz: lembrar QUAL livro foi.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * A tinta de uma honra, pelo NOME dela.
 *
 * O valor gravado no banco pode vir com o paragon colado ("gume+3"), porque é assim que
 * `degrauNovo` o escreve. O que interessa aqui é o degrau, e o degrau é o que vem antes
 * do `+`.
 *
 * As duas escadas compartilham a paleta degrau a degrau (ver lib/paleta.ts), então o
 * índice na escada é o índice na paleta — venha ele da literatura ou dos quadrinhos.
 */
export function tintaDeHonra(gravado: string | null | undefined): Tinta | null {
  if (!gravado) return null;

  const nome = gravado.split("+")[0]!.trim().toLowerCase();

  for (const forma of ["livro", "quadrinho"] as const) {
    const i = (HONRAS[forma] as readonly string[]).indexOf(nome);
    if (i >= 0) return DEGRAU[i] ?? null;
  }

  return null;
}

/** O nome de exibição de uma honra gravada. "gume+3" vira "Gume +3". */
export function nomeDaHonra(gravado: string | null | undefined): string | null {
  if (!gravado) return null;

  const [nome, estrelas] = gravado.split("+");
  const base = NOME[(nome ?? "").trim().toLowerCase() as Honra];
  if (!base) return null;

  return estrelas ? `${base} +${estrelas}` : base;
}
