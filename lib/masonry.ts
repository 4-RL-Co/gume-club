/**
 * ════════════════════════════════════════════════════════════════════
 *  COLUNAS DE ALTURA PARECIDA, CALCULADAS — NÃO ADIVINHADAS PELO NAVEGADOR.
 *
 *  "e sobre estatisticas, olha essas boxes todas tortas" — o dono, com o
 *  print do resumo do perfil: uma coluna com um cartão gigante ("quem
 *  publica", catorze linhas) e as outras duas com metade da altura.
 *
 *  O CSS `columns-N` (usado antes) empacota sozinho, mas com POUCOS
 *  cartões de alturas bem diferentes o algoritmo de balanceamento do
 *  navegador erra feio: ele mede a altura total, divide por N, e enche
 *  cada coluna até bater esse alvo — sem saber que um cartão sozinho já
 *  passa do alvo, e sem redistribuir os outros pra compensar. Cinco ou
 *  seis blocos é pouca coisa pra esse algoritmo acertar.
 *
 *  Aqui a gente sabe o tamanho de cada cartão de antemão (o número de
 *  linhas que ele desenha), então empacota à mão: ordena do mais pesado
 *  pro mais leve, e cada um vai pra coluna que está mais vazia no
 *  momento. É o "greedy" clássico de empacotamento — não é o ótimo
 *  matemático (que é NP-difícil), mas para meia dúzia de cartões o
 *  resultado é indistinguível do ótimo, e o cálculo é instantâneo.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * Distribui `itens` em `colunas` grupos de peso parecido. `peso` é uma
 * estimativa de altura (linhas, ou qualquer unidade relativa consistente
 * entre os itens) — nunca pixel de verdade, porque isto roda no servidor,
 * antes de existir uma tela pra medir.
 */
export function empacotar<T>(itens: readonly T[], peso: (item: T) => number, colunas: number): T[][] {
  const baldes: T[][] = Array.from({ length: colunas }, () => []);
  if (itens.length === 0 || colunas < 1) return baldes;

  const pesos = new Array(colunas).fill(0);
  const ordenados = [...itens].sort((a, b) => peso(b) - peso(a));

  for (const item of ordenados) {
    const i = pesos.indexOf(Math.min(...pesos));
    baldes[i]!.push(item);
    pesos[i]! += peso(item);
  }

  return baldes;
}
