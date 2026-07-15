-- Fatia 0: de-duplicate works created by a double seed run, then enforce
-- uniqueness. Survivor per (title, author_id, volume) = the earliest row.
-- Each statement recomputes the survivor map via a window function so it stands
-- alone across statement breakpoints (no temp tables, no cross-statement state).

-- Repoint library_entries from loser works to the survivor where that would not
-- collide with the survivor's own entry.
WITH s AS (
  SELECT id, first_value(id) OVER (
    PARTITION BY title, author_id, volume ORDER BY created_at, id
  ) AS keep FROM works
)
UPDATE library_entries le SET work_id = s.keep
FROM s
WHERE le.work_id = s.id AND s.id <> s.keep
  AND NOT EXISTS (
    SELECT 1 FROM library_entries x
    WHERE x.user_id = le.user_id AND x.work_id = s.keep
  );
--> statement-breakpoint

-- Drop the leftover loser entries (pure duplicates from the second seed run).
WITH s AS (
  SELECT id, first_value(id) OVER (
    PARTITION BY title, author_id, volume ORDER BY created_at, id
  ) AS keep FROM works
)
DELETE FROM library_entries le USING s
WHERE le.work_id = s.id AND s.id <> s.keep;
--> statement-breakpoint

-- Same treatment for owned_copies.
WITH s AS (
  SELECT id, first_value(id) OVER (
    PARTITION BY title, author_id, volume ORDER BY created_at, id
  ) AS keep FROM works
)
UPDATE owned_copies oc SET work_id = s.keep
FROM s
WHERE oc.work_id = s.id AND s.id <> s.keep
  AND NOT EXISTS (
    SELECT 1 FROM owned_copies x
    WHERE x.user_id = oc.user_id AND x.work_id = s.keep
  );
--> statement-breakpoint

WITH s AS (
  SELECT id, first_value(id) OVER (
    PARTITION BY title, author_id, volume ORDER BY created_at, id
  ) AS keep FROM works
)
DELETE FROM owned_copies oc USING s
WHERE oc.work_id = s.id AND s.id <> s.keep;
--> statement-breakpoint

-- Repoint editions onto the survivor work before the loser works are deleted.
WITH s AS (
  SELECT id, first_value(id) OVER (
    PARTITION BY title, author_id, volume ORDER BY created_at, id
  ) AS keep FROM works
)
UPDATE editions e SET work_id = s.keep
FROM s
WHERE e.work_id = s.id AND s.id <> s.keep;
--> statement-breakpoint

-- Delete the loser works.
WITH s AS (
  SELECT id, first_value(id) OVER (
    PARTITION BY title, author_id, volume ORDER BY created_at, id
  ) AS keep FROM works
)
DELETE FROM works w USING s
WHERE w.id = s.id AND s.id <> s.keep;
--> statement-breakpoint

-- Collapse duplicate editions now sharing a work (same isbn13, or both null on
-- the same work). Repoint owned_copies.edition_id before deleting.
WITH es AS (
  SELECT id, first_value(id) OVER (
    PARTITION BY work_id, isbn13 ORDER BY created_at, id
  ) AS keep FROM editions
)
UPDATE owned_copies oc SET edition_id = es.keep
FROM es
WHERE oc.edition_id = es.id AND es.id <> es.keep;
--> statement-breakpoint

WITH es AS (
  SELECT id, first_value(id) OVER (
    PARTITION BY work_id, isbn13 ORDER BY created_at, id
  ) AS keep FROM editions
)
DELETE FROM editions e USING es
WHERE e.id = es.id AND es.id <> es.keep;
--> statement-breakpoint

-- Data is clean: enforce it. NULLS NOT DISTINCT so a classic (volume null) is
-- still one row per (title, author).
ALTER TABLE "works" ADD CONSTRAINT "works_title_author_volume" UNIQUE NULLS NOT DISTINCT("title","author_id","volume");
