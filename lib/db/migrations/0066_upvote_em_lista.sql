-- ════════════════════════════════════════════════════════════════════
--  O UPVOTE CHEGA NAS LISTAS. "quero q dê pra dar upvote em resenhas e
--  listas" — o dono, depois de "upvote é ferramenta de amizade".
--
--  Mesma forma de review_upvotes (migration 0064), tabela própria — não uma
--  FK polimórfica (edition_id ora aponta pra resenha, ora pra lista): este
--  repo não usa esse padrão em lugar nenhum, e uma FK que muda de sentido é
--  uma FK que o Postgres não consegue garantir sozinho.
--
--  "guardar" já existia para listas (collection_saves) e não é a mesma
--  coisa: guardar é COMPROMETER — pôr a curadoria de alguém dentro do seu
--  próprio perfil, assinada com o nome dela. Upvote é mais leve: "gostei",
--  sem levar para casa. As duas continuam separadas.
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "list_upvotes" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "collection_id" uuid NOT NULL REFERENCES "collections"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "collection_id")
);

CREATE INDEX IF NOT EXISTS "list_upvotes_collection_idx" ON "list_upvotes" ("collection_id");
