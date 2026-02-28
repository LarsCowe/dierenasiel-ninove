CREATE TABLE "adoption_candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(200) NOT NULL,
	"phone" varchar(20),
	"address" text,
	"animal_id" integer NOT NULL,
	"questionnaire_answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"category" varchar(30),
	"category_set_by" varchar(100),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "adoption_candidates" ADD CONSTRAINT "adoption_candidates_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_adoption_candidates_animal_id" ON "adoption_candidates" USING btree ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_adoption_candidates_status" ON "adoption_candidates" USING btree ("status");