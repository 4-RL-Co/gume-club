CREATE TYPE "public"."acquired_from" AS ENUM('bookshop', 'sebo', 'amazon', 'book_fair', 'gift', 'inheritance', 'swap', 'crowdfunding', 'subscription_box', 'publisher', 'library', 'other');--> statement-breakpoint
CREATE TYPE "public"."edition_format" AS ENUM('hardcover', 'paperback', 'ebook', 'audiobook', 'other');--> statement-breakpoint
CREATE TYPE "public"."own_state" AS ENUM('owned', 'wanted', 'lent_out', 'gone');--> statement-breakpoint
CREATE TYPE "public"."shelf_status" AS ENUM('want_to_read', 'reading', 'read', 'did_not_finish');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"nationality" text,
	"openlibrary_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "authors_openlibrary_key_unique" UNIQUE("openlibrary_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "editions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_id" uuid NOT NULL,
	"isbn13" text,
	"publisher" text,
	"published_year" integer,
	"language" text DEFAULT 'pt-BR' NOT NULL,
	"page_count" integer,
	"format" "edition_format" DEFAULT 'paperback' NOT NULL,
	"cover_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "editions_isbn13_unique" UNIQUE("isbn13")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "library_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"work_id" uuid NOT NULL,
	"status" "shelf_status" DEFAULT 'want_to_read' NOT NULL,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "owned_copies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"work_id" uuid NOT NULL,
	"edition_id" uuid,
	"state" "own_state" DEFAULT 'owned' NOT NULL,
	"acquired_from" "acquired_from",
	"acquired_on" date,
	"acquired_note" text,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"kind" text DEFAULT 'series' NOT NULL,
	"status" text DEFAULT 'unknown' NOT NULL,
	"anilist_id" integer,
	"total_volumes" integer,
	CONSTRAINT "series_title_unique" UNIQUE("title"),
	CONSTRAINT "series_anilist_id_unique" UNIQUE("anilist_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "works" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"author_id" uuid,
	"series_id" uuid,
	"volume" numeric(6, 1),
	"first_published" integer,
	"genre" text,
	"subject" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "editions" ADD CONSTRAINT "editions_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "library_entries" ADD CONSTRAINT "library_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "library_entries" ADD CONSTRAINT "library_entries_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "owned_copies" ADD CONSTRAINT "owned_copies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "owned_copies" ADD CONSTRAINT "owned_copies_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "owned_copies" ADD CONSTRAINT "owned_copies_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "works" ADD CONSTRAINT "works_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "works" ADD CONSTRAINT "works_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "authors_name_key" ON "authors" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "editions_work_idx" ON "editions" USING btree ("work_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "library_entries_user_work" ON "library_entries" USING btree ("user_id","work_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "owned_copies_user_work" ON "owned_copies" USING btree ("user_id","work_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "works_title_idx" ON "works" USING btree ("title");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "follows_pk" ON "follows" USING btree ("follower_id","followee_id");