CREATE TABLE "vet_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"animal_id" integer NOT NULL,
	"date" date NOT NULL,
	"location" varchar(50) NOT NULL,
	"complaints" text,
	"todo" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"recorded_by" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "vet_visits" ADD CONSTRAINT "vet_visits_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vet_visits" ADD CONSTRAINT "vet_visits_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_vet_visits_animal_id" ON "vet_visits" USING btree ("animal_id");