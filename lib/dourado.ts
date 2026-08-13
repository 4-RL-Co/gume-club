/**
 * ════════════════════════════════════════════════════════════════════
 *  O DOURADO. Uma cor, dois usos que não se conhecem — e por isso um lugar só.
 *
 *  O `ai/DECISIONS.md` já chama essa cor de "o dourado" em prosa (a entrada de
 *  `components/conjunto.tsx`: "o dourado continua a única cor da tela"). Ela
 *  aparecia hardcoded (`#d9a520`) em onze pontos de oito arquivos, sem teste
 *  travando o valor — o tipo de repetição que diverge um dia, e aí metade da
 *  tela fica com um dourado e a outra com outro.
 *
 *  Ela serve DUAS coisas que não têm nada a ver uma com a outra:
 *   - o troféu de coleção completa (algo que a PESSOA conquista, ver
 *     `components/selo-colecionador.tsx`);
 *   - a coroa da curadoria da casa, em "Top 100: os queridinhos do Gume"
 *     (algo que o GUME escolhe — ver ai/DECISIONS.md, "coroa dourada, exceção
 *     de cor dirigida pelo dono").
 *
 *  Elas só compartilham o hex por coincidência de gosto, não de significado.
 *  Por isso este arquivo não se chama `ouro-colecao.ts`: um nome preso à
 *  coleção mentiria sobre a coroa. NUNCA entra no sistema de insígnias
 *  (`lib/badges-view.ts`) — aquele é OKLCH travado por teste
 *  (`lib/paleta.test.ts`), matematicamente cheio, e o dourado nem é insígnia.
 * ════════════════════════════════════════════════════════════════════
 */

export const DOURADO = "#d9a520";
