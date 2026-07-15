-- ════════════════════════════════════════════════════════════════════
--  "ELO" É LEAGUE OF LEGENDS. AQUI É HONRA.
--
--  A coluna `activities.elo` nasceu ontem e já estava com o nome errado. "Elo" é uma
--  palavra emprestada de outro jogo, e o Gume não é decalque de ninguém.
--
--  **Honra** é portuguesa, e diz o que a coisa é: um reconhecimento pelo que você leu na
--  vida, e não uma posição numa fila.
--
--  Uma coluna com o nome errado é uma mentira que a gente conta para si mesmo toda vez
--  que abre o arquivo. Custa uma migration hoje e custa um ano de confusão depois.
-- ════════════════════════════════════════════════════════════════════

alter table activities rename column elo to honra;
