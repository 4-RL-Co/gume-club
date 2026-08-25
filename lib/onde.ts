/**
 * ════════════════════════════════════════════════════════════════════
 *  OS ENDEREÇOS QUE FICAM FORA DO GUME.
 *
 *  Estavam copiados à mão em quatro telas. Um endereço copiado em quatro lugares é um
 *  endereço que muda em três — e o quarto vira um link morto que ninguém percebe, porque
 *  quem clica num link morto vai embora em vez de reclamar.
 *
 *  ═══ A CONVERSA SAIU, E DOIS CANAIS TOMARAM O LUGAR ═══
 *
 *  "A parte 'a conversa' direcionando pro github discussions acho nichado demais" — o
 *  dono. Discussions é onde quem já lê o código do Gume conversa; não é onde um leitor
 *  qualquer vai procurar a marca. O Instagram do Gume é o canal de contato, e o Discord
 *  é onde se conversa de verdade — e os dois moram aqui pelo mesmo motivo que CODIGO
 *  morava: um endereço em lugar só.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * O SLUG DO REPOSITÓRIO, NUM LUGAR SÓ.
 *
 * `dono/nome`, e nada mais. Ele já mudou DUAS vezes: o nome ganhou um hífen, e depois o
 * repositório trocou de dono. As duas trocas
 * mostrou por que ele precisa morar aqui: o slug não é só um link. `lib/contributors.ts`
 * chama a API do GitHub com ele para saber quem tem PR mesclado (a insígnia de construtor).
 * Com o nome errado, ele bate num repositório que não existe, a /contribuidores esvazia, e
 * a insígnia some de todo mundo, sem erro nenhum. É a mesma armadilha de "não traduza falha
 * em ausência", disparada por um rename. Um lugar só, e um teste (lib/nome-do-repo.test.ts)
 * que quebra a build se o nome velho voltar a aparecer em qualquer canto.
 */
export const REPO = "olegas4real/gume-club";

/** Onde o código mora. Só a página Sobre pode falar disso em voz alta. */
export const CODIGO = `https://github.com/${REPO}`;

/** O canal de contato do Gume: onde se opina no que vem por aí, e onde se avisa que algo quebrou. */
export const INSTAGRAM = "https://instagram.com/gumeclub";

/** O convite não expira — "esse convite não expira", o dono. Onde a conversa acontece de verdade. */
export const DISCORD = "https://discord.gg/4B3hmWE2Q2";
