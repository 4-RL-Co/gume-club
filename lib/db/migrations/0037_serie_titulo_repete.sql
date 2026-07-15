-- ════════════════════════════════════════════════════════════════════
--  DUAS SÉRIES PODEM TER O MESMO TÍTULO.
--
--  `series_title_unique` exigia título único, e isso é uma regra errada sobre o
--  mundo: a AniList tem TRÊS "Bakemonogatari" (o mangá do Oh!great, a adaptação
--  do romance, e o guia). Tem dois "Naruto: Sasuke's Story". São obras
--  diferentes, com o mesmo nome.
--
--  A IDENTIDADE de uma série é o `anilist_id`, e não o texto do título. Um nome
--  não é uma chave: nomes se repetem, e o mundo não pede desculpa por isso.
--
--  O endereço público continua único, porque ele é `slug` — e ali a colisão é
--  resolvida com um sufixo, como já acontece em `works` e `authors`.
-- ════════════════════════════════════════════════════════════════════

alter table series drop constraint if exists series_title_unique;

-- E o título continua indexado, porque a busca precisa dele. Só não é mais uma
-- promessa de unicidade que o mundo não cumpre.
create index if not exists series_title_idx on series (title);
