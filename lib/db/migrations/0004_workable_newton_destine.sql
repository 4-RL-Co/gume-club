CREATE TYPE "public"."identifier_kind" AS ENUM('isbn13', 'isbn10', 'openlibrary', 'google_books', 'oclc', 'asin');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "identifiers" (
	"edition_id" uuid NOT NULL,
	"kind" "identifier_kind" NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "openlibrary_key" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "identifiers" ADD CONSTRAINT "identifiers_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "identifiers_pk" ON "identifiers" USING btree ("kind","value");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "identifiers_edition_idx" ON "identifiers" USING btree ("edition_id");--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_openlibrary_key_unique" UNIQUE("openlibrary_key");