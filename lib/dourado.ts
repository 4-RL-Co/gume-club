/**
 * ════════════════════════════════════════════════════════════════════
 *  O DOURADO. A cor de toda coroa no app.
 *
 *  Ela aparecia hardcoded (`#d9a520`) em onze pontos de oito arquivos, sem teste
 *  travando o valor — o tipo de repetição que diverge um dia, e aí metade da
 *  tela fica com um dourado e a outra com outro.
 *
 *  ═══ ELA JÁ SERVIU DUAS COISAS, E UMA SAIU (E DEPOIS VOLTOU, DIFERENTE) ═══
 *
 *  Até a migration 0062, esta cor também era o troféu de coleção completa (algo
 *  que a PESSOA conquistava, colecionando). O colecionador saiu do app ("acho
 *  que vai tirar muito o foco de um app que é pra leitura"), e por um tempo o
 *  dourado ficou só com a coroa da curadoria da casa, em "Top 100: os
 *  queridinhos do Gume" (algo que o GUME escolhe — ver ai/DECISIONS.md, "coroa
 *  dourada, exceção de cor dirigida pelo dono").
 *
 *  Depois voltou a servir DUAS coisas, mas nenhuma delas é mais "coleção":
 *  também é a coroa dos FAVORITOS (`components/favoritos-vitrine.tsx`,
 *  `gerenciar-favoritos.tsx`) — algo que a PESSOA escolhe, e que usava
 *  `--color-accent` (o verde-água) até o dono achar "sem graça". Coroa é
 *  ouro, seja de quem escolheu o quê; o que muda entre casa e pessoa é o
 *  CONTEXTO onde ela aparece, não a cor.
 *
 *  NUNCA entra no sistema de insígnias (`lib/badges-view.ts`) — aquele é OKLCH
 *  travado por teste (`lib/paleta.test.ts`), matematicamente cheio, e o
 *  dourado nem é insígnia.
 * ════════════════════════════════════════════════════════════════════
 */

export const DOURADO = "#d9a520";
