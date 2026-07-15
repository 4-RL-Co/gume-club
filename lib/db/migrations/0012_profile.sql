-- Fatia B: the profile becomes a person.
--
-- users.image already exists (Better Auth put it there). These are the rest.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" text;
--> statement-breakpoint

-- Supporter cosmetics. The structure lands now; switching them on is a later
-- decision. They are the ONLY thing money will ever buy here: never privacy,
-- never reach, never a feature somebody else does not get. See the README.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cover_url" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accent_color" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_supporter" boolean NOT NULL DEFAULT false;
