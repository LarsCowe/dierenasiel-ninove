CREATE TABLE "neglect_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"animal_id" integer NOT NULL,
	"date" date,
	"vet_name" varchar(200),
	"health_status_on_arrival" text NOT NULL,
	"neglect_findings" text NOT NULL,
	"treatments_given" text,
	"weight_on_arrival" varchar(50),
	"photos" text[],
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "neglect_reports_animal_id_unique" UNIQUE("animal_id")
);
--> statement-breakpoint
ALTER TABLE "neglect_reports" ADD CONSTRAINT "neglect_reports_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_neglect_reports_animal_id" ON "neglect_reports" USING btree ("animal_id");