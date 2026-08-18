-- ════════════════════════════════════════════════════════════════════
--  OS FAVORITOS. Até cinco, e o primeiro é o coroado.
--
--  "não gosto de mostrar TODOS os livros que amei — quero escolher 5, e coroar
--  1" — inspirado no destaque do yourgamerprofile.com. Substitui o carrossel
--  "o que eu adorei" (todo 5 estrelas, sem limite, automático) por uma escolha
--  manual e pequena: curadoria de verdade, do mesmo jeito que uma lista já é.
--
--  `position` é 1 a 5 NA PRÁTICA, e a posição 1 É a coroa — não existe uma
--  segunda coluna (`crowned`) que pudesse discordar da posição algum dia.
--  Coroar é mover para a posição 1; os outros deslizam.
--
--  SEM CHECK travando o intervalo, de propósito: reordenar (coroar, tirar do
--  meio) precisa de um offset NEGATIVO temporário dentro da transação, pra
--  não colidir com o UNIQUE abaixo — e um CHECK nunca pode ser DEFERRABLE no
--  Postgres (só UNIQUE pode). Só lib/favoritos.ts escreve nesta tabela, e é
--  ele quem garante o intervalo.
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "favorite_books" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "work_id" uuid NOT NULL REFERENCES "works"("id") ON DELETE CASCADE,
  "position" smallint NOT NULL,
  "added_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "work_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "favorite_books_user_position" ON "favorite_books" ("user_id", "position");
