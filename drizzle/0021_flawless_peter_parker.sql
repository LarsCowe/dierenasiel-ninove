CREATE TABLE "kennismakingen" (
	"id" serial PRIMARY KEY NOT NULL,
	"adoption_candidate_id" integer NOT NULL,
	"animal_id" integer NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"location" varchar(200),
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"outcome" varchar(20),
	"notes" text,
	"created_by" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kennismakingen" ADD CONSTRAINT "kennismakingen_adoption_candidate_id_adoption_candidates_id_fk" FOREIGN KEY ("adoption_candidate_id") REFERENCES "public"."adoption_candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kennismakingen" ADD CONSTRAINT "kennismakingen_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_kennismakingen_candidate_id" ON "kennismakingen" USING btree ("adoption_candidate_id");