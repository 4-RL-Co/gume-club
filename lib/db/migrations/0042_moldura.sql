-- ════════════════════════════════════════════════════════════════════
--  QUAL MOLDURA A PESSOA QUER USAR.
--
--  Quem apoia o Gume tem DUAS: a do elo dela, e a de apoiador. E ela escolhe — porque
--  as duas dizem coisas diferentes, e nenhuma ganha da outra:
--
--      a do ELO       diz quanto você leu na vida
--      a de APOIADOR  diz que você paga a conta do servidor
--
--  Alguém que é Grão-Mestre pode preferir mostrar o Grão-Mestre. Alguém que acabou de
--  chegar e apoia pode preferir mostrar que apoia. As duas escolhas são legítimas, e
--  quem decide é a pessoa.
--
--  ═══ O PADRÃO É O ELO ═══
--
--  `null` quer dizer "a do meu elo". Duas razões, e as duas importam:
--
--    · quem NÃO apoia nunca teve escolha, e não pode acabar sem moldura nenhuma por
--      causa de uma coluna vazia;
--    · e o Gume não empurra o apoio na cara de ninguém. Quem paga escolhe se quer
--      mostrar; o padrão não faz propaganda por ele.
--
--  ═══ E POR QUE NÃO UM BOOLEANO ═══
--
--  `mostrar_apoiador boolean` responderia hoje e mentiria amanhã. No dia em que existir
--  uma terceira moldura — um evento, uma temporada, uma coisa que a gente ainda não
--  imaginou — o booleano vira um `if` com três braços, e alguém acrescenta uma segunda
--  coluna. Um texto com uma trava é honesto agora e continua honesto depois.
-- ════════════════════════════════════════════════════════════════════

alter table users
  add column if not exists moldura text;

/*
 * A TRAVA. Só 'apoiador', ou nada.
 *
 * `null` = a moldura do meu elo (o padrão). 'apoiador' = a verde-água.
 *
 * Não existe 'diamante' aqui, e nunca vai existir: o elo é CALCULADO a partir do que a
 * pessoa leu, e uma coluna que deixasse alguém escrever o próprio elo seria uma coluna
 * que deixa qualquer um se declarar Desafiante. O que é conquistado não se digita.
 */
alter table users
  drop constraint if exists users_moldura_valida;

alter table users
  add constraint users_moldura_valida check (moldura is null or moldura = 'apoiador');
