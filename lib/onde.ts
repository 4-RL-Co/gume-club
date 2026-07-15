/**
 * ════════════════════════════════════════════════════════════════════
 *  OS DOIS ENDEREÇOS QUE FICAM FORA DO GUME.
 *
 *  Estavam copiados à mão em quatro telas. Um endereço copiado em quatro lugares é um
 *  endereço que muda em três — e o quarto vira um link morto que ninguém percebe, porque
 *  quem clica num link morto vai embora em vez de reclamar.
 *
 *  ═══ E A CONVERSA PRECISA SER FÁCIL DE ACHAR ═══
 *
 *  Ela existia em três telas, e nas três era um link solto no fim de um parágrafo, lá
 *  embaixo. Estar no app e ser encontrável no app são coisas diferentes: o que está no
 *  rodapé de um texto é lido por quem já leu o texto todo, que é quase ninguém.
 *
 *  É onde se decide o que o Gume vai ser. Isso não pode morar num rodapé.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * O SLUG DO REPOSITÓRIO, NUM LUGAR SÓ.
 *
 * `dono/nome`, e nada mais. O nome do repositório mudou uma vez (ganhou um hífen), e a troca
 * mostrou por que ele precisa morar aqui: o slug não é só um link. `lib/contributors.ts`
 * chama a API do GitHub com ele para saber quem tem PR mesclado (a insígnia de construtor).
 * Com o nome errado, ele bate num repositório que não existe, a /contribuidores esvazia, e
 * a insígnia some de todo mundo, sem erro nenhum. É a mesma armadilha de "não traduza falha
 * em ausência", disparada por um rename. Um lugar só, e um teste (lib/nome-do-repo.test.ts)
 * que quebra a build se o nome velho voltar a aparecer em qualquer canto.
 */
export const REPO = "4-RL-Co/gume-club";

/** Onde o código mora. Só a página Sobre pode falar disso em voz alta. */
export const CODIGO = `https://github.com/${REPO}`;

/** Onde se conversa sobre o que vem por aí, e onde se avisa que algo quebrou. */
export const CONVERSA = `${CODIGO}/discussions`;
