-- ════════════════════════════════════════════════════════════════════
--  "O QUE VEM POR AÍ". Reabre a decisão de 2026-07-11 ("o roadmap mora
--  no GitHub Discussions... uma página dedicada é construída só quando
--  houver propostas suficientes"). "A conversa" saiu da barra por ser
--  "nichado demais" nesta mesma sessão — não fazia mais sentido dizer
--  que o roadmap mora lá. Ver ai/DECISIONS.md.
--
--  "crie uma pagina de roadmap onde eu vou colocar funcionalidades q
--  estão planejadas, que estão em andamento e ideias" + "cada usuario
--  tem 3 upvotes por ano para gatar nessses itens" — o dono.
--
--  Um item nasce "ideia", o dono sobe o status à mão até "lancado" — a
--  transição PARA "lancado" grava lancado_em, o que ordena o changelog
--  ("o que chegou"). Sem status de "recusado": o que não vai ser
--  construído, o dono apaga.
--
--  O voto tem o ANO na própria chave primária, e não um job de reset:
--  não existe cron neste repo. A mesma pessoa pode votar no mesmo item
--  de novo num ano seguinte (interesse que persiste, histórico nunca
--  apagado), mas nunca duas vezes no mesmo item dentro do mesmo ano. O
--  teto de 3 por ano é contado em lib/roadmap.ts, do mesmo jeito que
--  favoritar() conta os 5 antes de inserir o 6º (lib/favoritos.ts).
-- ════════════════════════════════════════════════════════════════════
CREATE TYPE "roadmap_status" AS ENUM ('ideia', 'planejado', 'em_andamento', 'lancado');

CREATE TABLE IF NOT EXISTS "roadmap_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "description" text,
  "status" "roadmap_status" NOT NULL DEFAULT 'ideia',
  "position" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "lancado_em" timestamptz
);

CREATE TABLE IF NOT EXISTS "roadmap_votes" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "item_id" uuid NOT NULL REFERENCES "roadmap_items"("id") ON DELETE CASCADE,
  "ano" smallint NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "item_id", "ano")
);

CREATE INDEX IF NOT EXISTS "roadmap_votes_item_idx" ON "roadmap_votes" ("item_id");
