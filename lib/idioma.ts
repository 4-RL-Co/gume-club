/**
 * ════════════════════════════════════════════════════════════════════
 *  ISTO ESTÁ EM PORTUGUÊS?
 *
 *  Duas perguntas do app dependem disso, e as duas são caras de errar:
 *
 *    · a SINOPSE em inglês não vai para a tela. A maioria do público não lê em
 *      inglês, e uma sinopse que a pessoa não entende é pior do que nenhuma.
 *    · o TÍTULO em inglês é o sinal de que a ficha talvez não seja de um livro que
 *      alguém aqui vá ler.
 *
 *  ═══ COMO, E POR QUE ASSIM ═══
 *
 *  Palavras curtas e comuníssimas — "the", "of", "que", "não". Elas são o esqueleto
 *  de uma língua: aparecem em qualquer texto dela, e quase nunca na outra.
 *
 *  Não é um classificador de verdade, e não pretende ser. É uma pergunta binária
 *  entre DUAS línguas que a gente conhece, sobre um texto que já sabemos que é um
 *  título de livro ou uma sinopse.
 *
 *  ═══ E QUANDO NÃO DÁ PARA SABER ═══
 *
 *  Ele responde `null`, e nunca chuta. "Berserk" não é português nem inglês; "Kafka"
 *  também não. Um detector que chuta transforma o desconhecido em uma afirmação — e
 *  esse é o bug mais caro deste projeto, escrito em letras garrafais no AGENTS.md:
 *  NUNCA TRADUZA FALHA DE COMUNICAÇÃO EM AUSÊNCIA DE DADO.
 *
 *  Quem chama decide o que fazer com o `null`. Aqui, ele nunca vira "inglês".
 * ════════════════════════════════════════════════════════════════════
 */

/** O esqueleto do português. Palavras que quase não existem em inglês. */
const PORTUGUES = new Set([
  "o", "de", "da", "do", "das", "dos", "e", "é", "em", "no", "na", "nos", "nas",
  "um", "uma", "uns", "umas", "os", "as", "ao", "aos", "à", "às",
  "que", "não", "com", "por", "para", "pelo", "pela", "como", "mais", "seu",
  "sua", "seus", "suas", "ele", "ela", "eles", "elas", "foi", "ser", "está",
  "são", "mas", "quando", "sobre", "entre", "até", "muito", "já", "também",
  "onde", "quem", "isso", "esse", "essa", "este", "esta", "aquele", "depois",
]);

/**
 * O esqueleto do inglês.
 *
 * "a", "no", "as", "e", "os", "em" e "por" ficaram DE FORA das duas listas quando são
 * ambíguas: "a" e "no" são palavras das duas línguas, e uma palavra que serve às duas
 * não decide nada — ela só faz barulho. Uma lista com ruído responde com confiança
 * sobre um empate, e é assim que um detector mente.
 */
const INGLES = new Set([
  "the", "of", "and", "in", "to", "is", "was", "are", "were", "be", "been",
  "his", "her", "its", "their", "our", "your", "my", "who", "which", "that",
  "this", "these", "those", "with", "from", "for", "on", "at", "by", "an",
  "it", "he", "she", "they", "we", "you", "not", "but", "how", "when", "where",
  "about", "into", "through", "after", "before", "between", "story", "life",
]);

export type Idioma = "pt" | "en" | null;

/**
 * Sem acento, sem pontuação, em minúsculas. O acento SOZINHO já quase decide — mas
 * "Frankenstein" não tem acento nenhum e é um título perfeitamente português.
 */
function palavras(texto: string): string[] {
  return texto
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * A língua de um texto — ou `null`, quando não dá para saber.
 *
 * `minimo` é quantas palavras-esqueleto de uma língua precisam aparecer a mais do que
 * as da outra para a resposta ser dada. Dois, e não um: um "the" solto dentro de um
 * título português ("O boi e o burro = The ass and the ox") não faz do livro um livro
 * em inglês.
 */
export function idiomaDe(texto: string | null | undefined): Idioma {
  if (!texto) return null;

  const ps = palavras(texto);

  // Um acento agudo, um til, uma cedilha. Nenhum deles existe em inglês.
  const temAcento = /[áàâãéêíóôõúüç]/i.test(texto);

  let pt = 0;
  let en = 0;
  for (const p of ps) {
    if (PORTUGUES.has(p)) pt++;
    if (INGLES.has(p)) en++;
  }

  /**
   * ═══ A ORDEM DESTAS QUATRO REGRAS É O DETECTOR INTEIRO ═══
   *
   * 1. INGLÊS DECISIVO vem primeiro, e passa por cima do acento. Um artigo acadêmico
   *    em inglês sobre o Brasil escreve "São Paulo" no título, e um único acento não
   *    faz dele um livro em português.
   */
  if (en >= pt + 3) return "en";

  /**
   * 2. O ACENTO decide o resto. Ele não existe em inglês, ponto.
   *
   *    É ele que salva os catálogos bilíngues de museu — centenas deles no acervo, com
   *    o título nas duas línguas. "O burro e o boi no presépio = The ass and the ox in
   *    the Nativity scene" tem MAIS palavras inglesas do que portuguesas, e é um livro
   *    brasileiro. Contar palavras, sozinho, o apagaria.
   */
  if (temAcento) return "pt";

  /**
   * 3. Inglês sem acento nenhum e sem uma única palavra portuguesa. Precisa de DUAS
   *    palavras inglesas: "The Hobbit" tem uma só, e uma só não basta para acusar.
   */
  if (pt === 0 && en >= 2) return "en";

  /** 4. Uma palavra portuguesa e nenhuma inglesa: "A hora da estrela". */
  if (pt > 0 && en === 0) return "pt";

  /**
   * E o resto é NÃO SEI, que é uma resposta.
   *
   * "Berserk". "Frankenstein". "Ubirajara". "Hamlet". Nenhum deles tem esqueleto de
   * língua nenhuma — e um detector que chuta chamaria os quatro de ingleses, e apagaria
   * José de Alencar do acervo. Ver AGENTS.md.
   */
  return null;
}

/** Isto é claramente inglês? Só `true` quando o detector tem certeza. */
export function ehIngles(texto: string | null | undefined): boolean {
  return idiomaDe(texto) === "en";
}
