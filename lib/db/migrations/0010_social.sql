-- The social slice. Follows already existed; this adds the feed, the public
-- profile's backing data, and person-to-person recommendation.

-- ─────────────────────────────────────────── uuid v7
-- The feed pages by cursor on the id, so the id has to sort by time. gen_random_uuid()
-- is v4 and sorts randomly, which would make "give me the next page" meaningless.
-- Postgres 18 ships uuidv7(); we are on 16, so here it is.
CREATE OR REPLACE FUNCTION uuidv7() RETURNS uuid AS $$
DECLARE
  unix_ts_ms bytea;
  uuid_bytes bytea;
BEGIN
  unix_ts_ms = substring(int8send((extract(epoch from clock_timestamp()) * 1000)::bigint) from 3);
  uuid_bytes = uuid_send(gen_random_uuid());
  uuid_bytes = overlay(uuid_bytes placing unix_ts_ms from 1 for 6);
  -- stamp version 7 into the high nibble of byte 6
  uuid_bytes = set_byte(uuid_bytes, 6, (b'0111' || get_byte(uuid_bytes, 6)::bit(4))::bit(8)::int);
  RETURN encode(uuid_bytes, 'hex')::uuid;
END
$$ LANGUAGE plpgsql VOLATILE;
--> statement-breakpoint

-- ─────────────────────────────────────────── activities: the feed
--
-- Denormalised on purpose and queried on read: no fan-out-on-write, no per-user
-- inbox. At the scale of a chronological friends-only feed, selecting where
-- actor_id = ANY(followees) ORDER BY id DESC over a good index is correct and
-- boring. See docs/schema.md.
--
-- `visibility` MIRRORS the row the activity is about. Shelving a private book
-- writes a private activity. Without that, the feed becomes the leak: the shelf
-- row stays hidden and the activity announces it anyway.
CREATE TABLE IF NOT EXISTS "activities" (
  "id"             uuid PRIMARY KEY DEFAULT uuidv7(),
  "actor_id"       uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "verb"           text NOT NULL
                   CHECK ("verb" IN ('started','finished','shelved','rated','reviewed','recommended')),
  "work_id"        uuid NOT NULL REFERENCES "works"("id") ON DELETE CASCADE,
  -- the person a recommendation was aimed at. null for everything else.
  "target_user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
  "rating"         smallint CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 10),
  -- deleting a review takes its activity with it, in the same statement, so the
  -- feed never renders a headstone. See docs/schema.md.
  "review_id"      uuid REFERENCES "reviews"("id") ON DELETE CASCADE,
  "note"           text,
  "visibility"     visibility NOT NULL DEFAULT 'public',
  "created_at"     timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activities_actor_idx" ON "activities" ("actor_id", "id" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activities_feed_idx" ON "activities" ("id" DESC);
--> statement-breakpoint

-- ─────────────────────────────────────────── recommendations
--
-- One book, one person, one line of why. It lands on their shelf marked as having
-- come from a PERSON, which is the whole mechanic and the thing no competitor has.
CREATE TABLE IF NOT EXISTS "recommendations" (
  "id"           uuid PRIMARY KEY DEFAULT uuidv7(),
  "from_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "to_user_id"   uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "work_id"      uuid NOT NULL REFERENCES "works"("id") ON DELETE CASCADE,
  "note"         text,
  "created_at"   timestamptz NOT NULL DEFAULT now(),
  CHECK ("from_user_id" <> "to_user_id")
);
--> statement-breakpoint
-- the same person cannot recommend the same book twice: a nudge, never a nag
CREATE UNIQUE INDEX IF NOT EXISTS "recommendations_once"
  ON "recommendations" ("from_user_id", "to_user_id", "work_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recommendations_to_idx" ON "recommendations" ("to_user_id", "id" DESC);
--> statement-breakpoint

-- The mark on the shelf: this book came from a person, not from an algorithm.
ALTER TABLE "library_entries"
  ADD COLUMN IF NOT EXISTS "recommended_by" uuid REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint

-- ─────────────────────────────────────────── lineage
--
-- Who brought whom. There is no invite screen yet and none is being built: this
-- is one column and the line of code that fills it.
--
-- It has to exist NOW because who invited whom is knowable only at the moment of
-- signup. Build the invite screen in a fortnight and the lineage of the first ten
-- readers is already gone, and that is precisely the lineage that will matter.
--
-- ON DELETE SET NULL, not CASCADE: an inviter deleting their account must not
-- take the people they brought with them.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "invited_by" uuid REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_invited_by_idx" ON "users" ("invited_by");
