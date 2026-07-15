-- Fatia A: what the app was missing to actually be usable.

-- ─────────────────────────────────────────── provenance becomes free text
--
-- The fixed enum (sebo, feira, herança...) was a form pretending to be a memory.
-- Nobody acquired a book "subscription_box"; they got the January box from the
-- philosophy club, or their sister gave it to them. The interesting thing about a
-- book on a real shelf cannot be typed into a dropdown.
--
-- So: free text, never required, never nagged for. The 44 existing rows keep
-- their meaning: each enum value is rewritten as the words it always meant.
ALTER TABLE "owned_copies" ADD COLUMN IF NOT EXISTS "acquired_note_new" text;
--> statement-breakpoint

UPDATE "owned_copies" SET "acquired_note_new" = COALESCE(
  NULLIF("acquired_note", ''),
  CASE "acquired_from"::text
    WHEN 'sebo'             THEN 'sebo'
    WHEN 'book_fair'        THEN 'feira do livro'
    WHEN 'gift'             THEN 'presente'
    WHEN 'inheritance'      THEN 'herança'
    WHEN 'swap'             THEN 'troca'
    WHEN 'subscription_box' THEN 'caixa do clube'
    WHEN 'crowdfunding'     THEN 'financiamento coletivo'
    WHEN 'bookshop'         THEN 'livraria'
    WHEN 'amazon'           THEN 'Amazon'
    WHEN 'publisher'        THEN 'site da editora'
    WHEN 'library'          THEN 'biblioteca'
    ELSE NULL
  END
);
--> statement-breakpoint

ALTER TABLE "owned_copies" DROP COLUMN IF EXISTS "acquired_note";
--> statement-breakpoint
ALTER TABLE "owned_copies" RENAME COLUMN "acquired_note_new" TO "acquired_note";
--> statement-breakpoint
-- the enum column goes. The words it stood for are already in acquired_note.
ALTER TABLE "owned_copies" DROP COLUMN IF EXISTS "acquired_from";
--> statement-breakpoint
DROP TYPE IF EXISTS "acquired_from";
--> statement-breakpoint

-- ─────────────────────────────────────────── custom shelves
CREATE TABLE IF NOT EXISTS "collections" (
  "id"          uuid PRIMARY KEY DEFAULT uuidv7(),
  "user_id"     uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "slug"        citext NOT NULL,
  "name"        text NOT NULL,
  "description" text,
  "visibility"  visibility NOT NULL DEFAULT 'public',
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("user_id", "slug")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "collection_items" (
  "collection_id" uuid NOT NULL REFERENCES "collections"("id") ON DELETE CASCADE,
  "work_id"       uuid NOT NULL REFERENCES "works"("id") ON DELETE CASCADE,
  "position"      integer NOT NULL DEFAULT 0,
  "added_at"      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("collection_id", "work_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collection_items_work_idx" ON "collection_items" ("work_id");
--> statement-breakpoint

-- ─────────────────────────────────────────── personal tags
--
-- YOURS. Not a global vocabulary, not a tag cloud, not a folksonomy anybody else
-- can see or vote on. A tag here is a note to self, and it is private by default.
CREATE TABLE IF NOT EXISTS "work_tags" (
  "user_id"    uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "work_id"    uuid NOT NULL REFERENCES "works"("id") ON DELETE CASCADE,
  "tag"        citext NOT NULL,
  "visibility" visibility NOT NULL DEFAULT 'private',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "work_id", "tag")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "work_tags_user_idx" ON "work_tags" ("user_id", "tag");
--> statement-breakpoint

-- ─────────────────────────────────────────── revisions: nothing is overwritten silently
--
-- Anyone may edit any book in the catalogue. That only works because every edit
-- is append-only history with a name on it: what changed, what it was before, and
-- who did it. Trust is earnable and revocable, and a bad edit is revertable
-- because `previous` is right there.
CREATE TABLE IF NOT EXISTS "revisions" (
  "id"          uuid PRIMARY KEY DEFAULT uuidv7(),
  "user_id"     uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "target_type" text NOT NULL CHECK ("target_type" IN ('work','edition','author')),
  "target_id"   uuid NOT NULL,
  "patch"       jsonb NOT NULL,   -- what changed
  "previous"    jsonb NOT NULL,   -- what it was, so a revert is trivial
  "reason"      text,
  "created_at"  timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revisions_target_idx"
  ON "revisions" ("target_type", "target_id", "created_at" DESC);
