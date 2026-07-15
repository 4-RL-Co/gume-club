/**
 * ════════════════════════════════════════════════════════════════════
 *  O TETO DE TODO TEXTO QUE ENTRA.
 *
 *  Validado no SERVIDOR, sempre. `maxLength` no input é conforto para
 *  quem digita, e não vale nada contra quem não usa o seu formulário:
 *  uma requisição direta manda cinquenta megabytes de resenha, e sem
 *  teto isso chega no banco, incha o backup e derruba a página do livro
 *  para todo mundo que abrir. Não precisa de atacante esperto: precisa
 *  de um "colar" errado.
 *
 *  Um lugar só, para não existir um segundo lugar onde alguém esqueceu.
 * ════════════════════════════════════════════════════════════════════
 */
export const LIMITS = {
  /** A resenha é o texto mais longo que alguém escreve aqui, e mesmo ela tem fim. */
  review: 20_000,
  /** A linha do porquê de uma recomendação. */
  note: 280,
  /** A linha de perfil de uma PESSOA. É uma apresentação, e não uma biografia. */
  bio: 280,
  /**
   * A ficha de um AUTOR — "quem foi essa pessoa, em um parágrafo".
   *
   * Ela vivia com o mesmo teto de 280 da linha de perfil, e o resultado era o pior
   * jeito possível de ter um limite: a pessoa colava a biografia inteira, o formulário
   * aceitava sorrindo, o servidor cortava no caractere 280, e ela só descobria o corte
   * ao abrir a página do autor e ver a frase morrer no meio.
   *
   * Um parágrafo de verdade cabe em mil e duzentos caracteres. E agora o formulário
   * TRAVA no teto e mostra a contagem, em vez de deixar colar e cortar depois: o limite
   * que a pessoa não vê chegando não é um limite, é uma armadilha.
   */
  authorBio: 1_200,
  displayName: 60,
  handle: 30,
  /** Onde o livro foi comprado, ganhado, herdado. */
  provenance: 140,
  /** Nome de estante inventada. */
  shelfName: 60,
  /** Título e autor de livro, inclusive no cadastro à mão e na correção. */
  title: 300,
  author: 200,
  publisher: 200,
  /** O que se digita numa busca. Trigrama não fica melhor com um parágrafo. */
  query: 120,
  /** Uma lista colada: linhas, e o tamanho de cada linha. */
  listLines: 100,
  listLine: 200,
  /** URL de capa vinda de um formulário. */
  url: 2_000,
  /**
   * Um CSV importado: linhas, e o tamanho do arquivo.
   *
   * O teto de linhas não é rigor: é o que impede um arquivo de 40 mil linhas de
   * segurar uma conexão do pool por dez minutos e derrubar a tela de todo mundo.
   * Cinco mil livros é uma estante de vinte anos de leitura, e quem tiver mais
   * importa duas vezes, o que funciona porque o import é idempotente.
   */
  importLinhas: 5_000,
  /** 8 MB. Um CSV de 5 mil livros com resenhas longas dá menos de 3 MB. */
  importBytes: 8_000_000,
} as const;

/**
 * Corta e limpa. Devolve null quando não sobrou nada, porque campo vazio no banco
 * é null, e nunca uma string vazia: as duas coisas parecem iguais na tela e se
 * comportam de forma diferente em toda query que testa `is null`.
 */
export function clamp(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim().slice(0, max);
  return clean || null;
}

/** O mesmo, mas para campo obrigatório: devolve string, nunca null. */
export function clampRequired(value: unknown, max: number): string {
  return clamp(value, max) ?? "";
}
