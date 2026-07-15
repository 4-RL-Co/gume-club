/**
 * ════════════════════════════════════════════════════════════════════
 *  O QUE PODE ENTRAR NO DATASET ABERTO, E O QUE NÃO PODE.
 *
 *  O Gume promete publicar um dataset **CC0** — de graça, sem pedir nada em troca, sem
 *  exigir crédito. É uma das promessas do README, e é a mais fácil de quebrar sem
 *  ninguém perceber: basta um backfill novo escrever texto de uma fonte errada, e
 *  meses depois a gente estaria publicando o trabalho de outra pessoa como se fosse
 *  bem comum.
 *
 *  Por isso a regra mora aqui, em uma função, com um teste — e não numa frase bonita
 *  dentro de um arquivo de markdown. Documento não defende código.
 *
 *  ═══ AS QUATRO FONTES ═══
 *
 *    openlibrary   CC0.        Entra no dataset. Crédito por educação, não por dever.
 *    wikidata      CC0.        Entra no dataset.
 *    wikipedia     CC-BY-SA.   NÃO entra. Aparece na tela, com crédito — a licença
 *                              exige atribuição E obriga quem reusar a manter a mesma
 *                              licença. Republicar como CC0 seria relicenciar o
 *                              trabalho de outra pessoa.
 *    gume          CC0.        Escrito por um bibliotecário daqui. É nosso.
 *
 *  A licença não é burocracia. É a diferença entre um bem comum e um roubo educado.
 * ════════════════════════════════════════════════════════════════════
 */

/** As fontes de texto que o banco conhece. Bate com o enum `texto_fonte` da 0039. */
export const FONTES = ["openlibrary", "wikidata", "wikipedia", "gume"] as const;
export type Fonte = (typeof FONTES)[number];

/**
 * Este texto pode ser republicado no dataset CC0?
 *
 * Uma fonte que a gente não conhece responde **não**. O padrão é o cuidado: publicar
 * por engano é irreversível, e não publicar é só um buraco.
 */
export function entraNoDataset(fonte: string | null | undefined): boolean {
  return fonte === "openlibrary" || fonte === "wikidata" || fonte === "gume";
}

/** Esta fonte OBRIGA crédito na tela? A Wikipédia obriga; as outras merecem. */
export function exigeCredito(fonte: string | null | undefined): boolean {
  return fonte === "wikipedia";
}
