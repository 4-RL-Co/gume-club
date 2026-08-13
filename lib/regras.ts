/**
 * ════════════════════════════════════════════════════════════════════
 *  OS NÚMEROS DAS INSÍGNIAS. Um lugar só, e sem banco dentro.
 *
 *  ═══ O BUG QUE ESTE ARQUIVO EXISTE POR CAUSA DE ═══
 *
 *  O código dizia que membro fundador são as **cinquenta** primeiras pessoas.
 *  A tela dizia "você está entre as **cem** primeiras".
 *
 *  Ninguém mentiu de propósito: o número mudou de um lado e o texto ficou onde estava. É
 *  o mesmo bug do teto de caracteres, com outra roupa — uma coisa dita em dois lugares
 *  que um dia discorda de si mesma. E aqui ela discordava numa promessa: a insígnia
 *  prometia um clube de cem e entregava um de cinquenta.
 *
 *  Este arquivo é PURO de propósito: sem `db`, sem SQL, sem import de servidor. É o que
 *  permite que `lib/badges-view.ts` (que é vocabulário, e não pode tocar em banco) leia o
 *  mesmo número que a consulta usa.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * MEMBRO FUNDADOR: as cem primeiras. O corte é fixo, e não se move.
 *
 * Era CINQUENTA ("cem pessoas não são um começo, são um lançamento"), e o argumento
 * continua certo em abstrato — só que ele media a insígnia contra o tamanho de uma sala, e
 * o Gume não mede a si mesmo contra uma sala: mede contra a própria meta pública de cem
 * contas (ver `app/painel`). As cem primeiras SÃO o lançamento inteiro, não uma fração
 * dele, e "fundador" some de fazer sentido se o clube for menor que a coisa que ele fundou.
 * Decisão revertida com dono e motivo em `ai/DECISIONS.md`.
 */
export const CORTE_FUNDADOR = 100;

/** ZELADOR: dez correções de catálogo que SOBREVIVERAM (revertidas não contam). */
export const CORRECOES_PARA_ZELADOR = 10;

/** BIBLIOTECÁRIO: cinquenta. É o mesmo trabalho do zelador, cinco vezes mais fundo. */
export const CORRECOES_PARA_BIBLIOTECARIO = 50;

/**
 * ════════════════════════════════════════════════════════════════════
 *  ARAUTO. E por que ele ficou MUITO mais caro.
 *
 *  Era: **uma** pessoa convidada que tivesse posto **um** livro na estante.
 *
 *  Isso não é trazer gente para o Gume: é ter um amigo que abriu o app uma vez. Um
 *  convite e um clique, e a insígnia era sua. Uma insígnia que se ganha sem esforço não
 *  reconhece nada — ela só enfeita o perfil de todo mundo, e o que enfeita todo mundo não
 *  distingue ninguém.
 *
 *  Agora: **cinco** pessoas, e cada uma com **dez** livros na estante.
 *
 *  Dez livros é o ponto em que alguém parou de experimentar e passou a usar. Cinco
 *  pessoas assim é uma mesa de bar inteira que ficou — e é isso que "arauto" devia querer
 *  dizer desde o começo.
 *
 *  E continua SEM NÚMERO na tela: é insígnia, e não placar. Ninguém vai ver "arauto (12)"
 *  em lugar nenhum, porque aí a próxima coisa que nasce é a lista de quem convidou mais.
 * ════════════════════════════════════════════════════════════════════
 */
export const AMIGOS_PARA_ARAUTO = 5;

/** E cada um deles precisa ter uma estante de verdade, e não um cadastro. */
export const LIVROS_DO_AMIGO = 10;
