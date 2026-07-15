-- ════════════════════════════════════════════════════════════════════
--  QUEM SUBIU DE ELO APARECE NO FEED. E APARECE COM O LIVRO QUE O LEVOU LÁ.
--
--  O caminho óbvio seria uma linha nova no feed:
--
--      "o Rui subiu para Prata."
--
--  E ela seria uma linha vazia. Não diz o que ele leu, não dá em que clicar, e no dia
--  em que três amigos subirem de elo o feed vira um mural de parabéns — que é
--  exatamente o tipo de ruído que faz alguém parar de abrir um feed.
--
--  ═══ O DEGRAU PEGA CARONA NO LIVRO ═══
--
--      "o Rui terminou Dom Casmurro · virou Prata"
--
--  Uma linha só. O livro que o levou até lá fica com o crédito, e é nele que se clica.
--
--  Por isso o elo é uma COLUNA da atividade que já existe, e não um verbo novo: ele é
--  um adjetivo do "terminou", e não um acontecimento separado.
--
--  ═══ E ELE É GRAVADO NO INSTANTE EM QUE ACONTECE ═══
--
--  O degrau é do PASSADO: "quando você terminou este livro, você virou Prata". Se o
--  feed recalculasse o elo na hora de desenhar, ele mostraria o elo de HOJE ao lado de
--  um livro de março — e diria que Dom Casmurro te fez Diamante, o que é mentira.
--
--  Um fato sobre um instante se grava naquele instante. Ver lib/library.ts.
-- ════════════════════════════════════════════════════════════════════

alter table activities
  /*
   * O elo em que a pessoa ENTROU ao terminar este livro. `null` na esmagadora maioria
   * das linhas: subir de degrau é raro, e tem que continuar sendo.
   *
   * Guarda a chave ('prata', 'lamina', 'gume'), e não o nome de tela ('Prata') — o nome
   * é coisa da tela, e um dia ele muda. Já mudou: os três últimos elos eram "Mestre",
   * "Grão-Mestre" e "Desafiante" até ontem.
   */
  add column if not exists elo text;
