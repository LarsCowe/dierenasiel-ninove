CREATE TABLE "medications" (
	"id" serial PRIMARY KEY NOT NULL,
	"animal_id" integer NOT NULL,
	"medication_name" varchar(200) NOT NULL,
	"dosage" varchar(100) NOT NULL,
	"quantity" varchar(100),
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"recorded_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_medications_animal_id" ON "medications" USING btree ("animal_id");