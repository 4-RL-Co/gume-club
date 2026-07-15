-- Slug slice: works gets a public address. citext (case-insensitive), unique,
-- not null, generated from title + author, immutable once set. Because the
-- table already has rows, add nullable -> backfill -> set not null -> unique.

CREATE EXTENSION IF NOT EXISTS citext;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;
--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "slug" "citext";
--> statement-breakpoint

-- Backfill: slugify(title + '-' + author), mirroring lib/slug.ts. Collisions get
-- a short numeric suffix (-2, -3, ...), the earliest row keeping the bare slug.
WITH base AS (
  SELECT w.id, w.created_at,
         NULLIF(trim(both '-' FROM regexp_replace(
           lower(unaccent(w.title || '-' || coalesce(a.name, ''))),
           '[^a-z0-9]+', '-', 'g'
         )), '') AS s
  FROM works w
  LEFT JOIN authors a ON a.id = w.author_id
),
numbered AS (
  SELECT id, coalesce(s, 'obra') AS s,
         row_number() OVER (PARTITION BY coalesce(s, 'obra') ORDER BY created_at, id) AS rn
  FROM base
)
UPDATE works w
SET slug = CASE WHEN n.rn = 1 THEN n.s ELSE n.s || '-' || n.rn END
FROM numbered n
WHERE w.id = n.id;
--> statement-breakpoint

ALTER TABLE "works" ALTER COLUMN "slug" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_slug_unique" UNIQUE("slug");
