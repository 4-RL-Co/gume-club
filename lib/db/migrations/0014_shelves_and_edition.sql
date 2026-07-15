-- Tags and custom shelves did the same thing with two vocabularies, and the
-- reader had to learn both. One concept survives: the shelf.
--
-- What the tag had that was good was the INPUT, not the idea: you typed
-- "para reler, do meu pai" and were done, with no ceremony. That input is kept;
-- it now creates shelves. What dies is the second word for the same thing.
--
-- Nobody loses anything: every tag becomes a private shelf holding exactly the
-- books it tagged. A private shelf is what a tag always was.

INSERT INTO "collections" ("user_id", "slug", "name", "visibility")
SELECT DISTINCT
  wt."user_id",
  -- mirrors slugify() in lib/slug.ts
  coalesce(nullif(trim(both '-' FROM regexp_replace(
    lower(unaccent(wt."tag"::text)), '[^a-z0-9]+', '-', 'g')), ''), 'estante'),
  wt."tag"::text,
  'private'::visibility
FROM "work_tags" wt
ON CONFLICT ("user_id", "slug") DO NOTHING;
--> statement-breakpoint

INSERT INTO "collection_items" ("collection_id", "work_id")
SELECT c."id", wt."work_id"
FROM "work_tags" wt
JOIN "collections" c
  ON c."user_id" = wt."user_id"
 AND c."name" = wt."tag"::text
ON CONFLICT DO NOTHING;
--> statement-breakpoint

DROP TABLE IF EXISTS "work_tags";
--> statement-breakpoint

-- WHICH COPY AM I READING?
--
-- A work has many editions (Memórias Póstumas has 100 of them now), and the
-- reader was never asked which one is theirs. Page counts differ between
-- editions, so "page 200" means nothing without this, and so does the cover the
-- shelf chooses to show.
--
-- It lives on library_entries, not owned_copies: you can be reading a library
-- book you do not own.
ALTER TABLE "library_entries"
  ADD COLUMN IF NOT EXISTS "edition_id" uuid REFERENCES "editions"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "library_entries_edition_idx" ON "library_entries" ("edition_id");
--> statement-breakpoint

-- Somebody's shelf, and the copy they own, agree by default: if a reader already
-- told us which copy they own, that is the edition they are reading.
UPDATE "library_entries" le
SET "edition_id" = oc."edition_id"
FROM "owned_copies" oc
WHERE oc."user_id" = le."user_id"
  AND oc."work_id" = le."work_id"
  AND oc."edition_id" IS NOT NULL
  AND le."edition_id" IS NULL;
