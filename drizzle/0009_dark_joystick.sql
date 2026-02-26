CREATE TABLE "feeding_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"animal_id" integer NOT NULL,
	"questionnaire" jsonb NOT NULL,
	"notes" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "feeding_plans_animal_id_unique" UNIQUE("animal_id")
);
--> statement-breakpoint
ALTER TABLE "feeding_plans" ADD CONSTRAINT "feeding_plans_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_feeding_plans_animal_id" ON "feeding_plans" USING btree ("animal_id");