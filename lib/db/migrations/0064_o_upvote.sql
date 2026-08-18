-- ════════════════════════════════════════════════════════════════════
--  O UPVOTE. Um número, e nada mais — nunca um comentário.
--
--  "eu acho que deve ter upvote e comentário no gume... vai funcionar como
--  ferramenta de socialização" — o dono, sabendo que isso reabre duas
--  decisões antigas: o README promete "sem curtida"; ai/DECISIONS.md (11 de
--  julho) diz "sem comentários, nunca", com duas razões — produto (o feed
--  fica quieto) e operacional (uma pessoa só modera isto, e comentário é
--  onde a moderação morre).
--
--  O upvote entra agora; comentário livre fica para quando houver um plano
--  de moderação — a razão operacional da decisão antiga é sobre TEXTO NOVO
--  de estranho para ler e julgar, e um upvote não escreve nada: não tem o
--  que denunciar, não tem o que a pessoa lê que possa ferir. É a metade
--  barata da ideia, sem herdar o custo caro da outra metade.
--
--  Vota em RESENHA, nunca em pessoa — o mesmo limite que "queridinhos" já
--  desenha (lib/queridinhos.ts): ordenar LIVROS pelo carinho que
--  receberam é permitido, ordenar GENTE por quanto voto recebeu não é.
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "review_upvotes" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "review_id" uuid NOT NULL REFERENCES "reviews"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "review_id")
);

CREATE INDEX IF NOT EXISTS "review_upvotes_review_idx" ON "review_upvotes" ("review_id");
