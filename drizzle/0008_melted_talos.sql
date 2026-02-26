CREATE TABLE "behavior_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"animal_id" integer NOT NULL,
	"date" date NOT NULL,
	"checklist" jsonb NOT NULL,
	"notes" text,
	"recorded_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "behavior_records" ADD CONSTRAINT "behavior_records_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "behavior_records" ADD CONSTRAINT "behavior_records_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_behavior_records_animal_id" ON "behavior_records" USING btree ("animal_id");