CREATE TABLE IF NOT EXISTS "ratings" (
	"user_id" uuid NOT NULL,
	"work_id" uuid NOT NULL,
	"value" smallint NOT NULL,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"rated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ratings_half_stars" CHECK ("ratings"."value" between 1 and 10)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reading_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reading_id" uuid NOT NULL,
	"page" integer,
	"percent" numeric(5, 2),
	"note" text,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reading_progress_something" CHECK (num_nonnulls("reading_progress"."page", "reading_progress"."percent") >= 1),
	CONSTRAINT "reading_progress_page" CHECK ("reading_progress"."page" is null or "reading_progress"."page" >= 0),
	CONSTRAINT "reading_progress_percent" CHECK ("reading_progress"."percent" is null or ("reading_progress"."percent" >= 0 and "reading_progress"."percent" <= 100))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"edition_id" uuid,
	"started_on" date,
	"finished_on" date,
	"abandoned_on" date,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "readings_one_ending" CHECK (num_nonnulls("readings"."finished_on", "readings"."abandoned_on") <= 1)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"work_id" uuid NOT NULL,
	"reading_id" uuid,
	"body" text NOT NULL,
	"language" text DEFAULT 'pt-BR' NOT NULL,
	"has_spoilers" boolean DEFAULT false NOT NULL,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ratings" ADD CONSTRAINT "ratings_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_reading_id_readings_id_fk" FOREIGN KEY ("reading_id") REFERENCES "public"."readings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "readings" ADD CONSTRAINT "readings_entry_id_library_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."library_entries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "readings" ADD CONSTRAINT "readings_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reading_id_readings_id_fk" FOREIGN KEY ("reading_id") REFERENCES "public"."readings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ratings_pk" ON "ratings" USING btree ("user_id","work_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ratings_work_idx" ON "ratings" USING btree ("work_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reading_progress_reading_idx" ON "reading_progress" USING btree ("reading_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "readings_entry_idx" ON "readings" USING btree ("entry_id","started_on");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_user_work" ON "reviews" USING btree ("user_id","work_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_work_idx" ON "reviews" USING btree ("work_id","created_at");