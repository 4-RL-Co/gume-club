-- Auth (Better Auth). Hand-written: see SECURITY.md and AGENTS.md, auth flows
-- and session management are not vibe-coded.
--
-- A reader is ONE row in `users`. Better Auth maps onto that table instead of
-- bringing a second user table alongside it, so there is no "which user id is
-- this" question anywhere in the codebase, which is exactly the confusion that
-- ends with an ownership check comparing the wrong two ids.
--
-- Column names in session/account/verification are Better Auth's own camelCase
-- and are quoted. Do not tidy them: the library queries them by these names.

-- users gains the three columns Better Auth requires. email_verified takes a
-- default because the table already has rows, and a NOT NULL without one fails.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now();
--> statement-breakpoint

-- userId is uuid, NOT text: it points at users.id, which is a uuid. The schema
-- Better Auth's CLI emits assumes text ids; letting that through would have made
-- the foreign key uncreatable.
CREATE TABLE IF NOT EXISTS "session" (
  "id"         uuid PRIMARY KEY,
  "expiresAt"  timestamptz NOT NULL,
  "token"      text NOT NULL UNIQUE,
  "createdAt"  timestamptz NOT NULL DEFAULT now(),
  "updatedAt"  timestamptz NOT NULL DEFAULT now(),
  "ipAddress"  text,
  "userAgent"  text,
  "userId"     uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "account" (
  "id"                    uuid PRIMARY KEY,
  "accountId"             text NOT NULL,
  "providerId"            text NOT NULL,
  "userId"                uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "accessToken"           text,
  "refreshToken"          text,
  "idToken"               text,
  "accessTokenExpiresAt"  timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope"                 text,
  "password"              text,   -- Better Auth's hash. Never hand-rolled, never plaintext.
  "createdAt"             timestamptz NOT NULL DEFAULT now(),
  "updatedAt"             timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "verification" (
  "id"         uuid PRIMARY KEY,
  "identifier" text NOT NULL,
  "value"      text NOT NULL,
  "expiresAt"  timestamptz NOT NULL,
  "createdAt"  timestamptz NOT NULL DEFAULT now(),
  "updatedAt"  timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "session_user_idx" ON "session" ("userId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_user_idx" ON "account" ("userId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");
--> statement-breakpoint

-- Deleting an account must actually delete. Everything a reader wrote hangs off
-- users.id with ON DELETE CASCADE, and now so do their sessions and credentials.
-- See the README promise, and ai/PLAN.md ("deleção de conta que apaga de verdade").
