-- The catalogue is 373k works now, and the search was still asking the internet.
--
-- Searching our own catalogue with ILIKE '%x%' over 373k rows is a sequential
-- scan on every keystroke. Trigrams make it an index lookup, and they also make
-- the search forgiving, which matters more here than speed: a reader types
-- "memorias postumas" without accents, or "dom casmuro" with a typo, and a
-- catalogue that answers "nothing found" to that is a catalogue that lies.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint

-- unaccent is already installed (0003). Immutable wrapper so it can be indexed:
-- unaccent() is STABLE by default because a dictionary can be reconfigured, and
-- Postgres refuses to index a non-immutable expression.
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text AS $$
  SELECT public.unaccent('public.unaccent', $1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "works_title_trgm"
  ON "works" USING gin (immutable_unaccent(lower("title")) gin_trgm_ops);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "authors_name_trgm"
  ON "authors" USING gin (immutable_unaccent(lower("name")) gin_trgm_ops);
--> statement-breakpoint

-- An ISBN is the only identifier a reader can hold in their hand, so looking one
-- up has to be instant. identifiers is already unique on (kind, value).
CREATE INDEX IF NOT EXISTS "editions_isbn13_idx" ON "editions" ("isbn13");
--> statement-breakpoint

-- The author branch of the search joins works on author_id, and without this it
-- is a sequential scan over every work in the catalogue just to find the handful
-- written by one person. It also makes "every book by this author" cheap.
CREATE INDEX IF NOT EXISTS "works_author_idx" ON "works" ("author_id");
