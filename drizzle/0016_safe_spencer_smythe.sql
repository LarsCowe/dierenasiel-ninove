CREATE TABLE "animal_todos" (
	"id" serial PRIMARY KEY NOT NULL,
	"animal_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"completed_by_user_id" integer,
	"due_date" date,
	"is_auto_generated" boolean DEFAULT false NOT NULL,
	"workflow_phase" varchar(50),
	"priority" varchar(20) DEFAULT 'normaal' NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "animal_todos" ADD CONSTRAINT "animal_todos_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "animal_todos" ADD CONSTRAINT "animal_todos_completed_by_user_id_users_id_fk" FOREIGN KEY ("completed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "animal_todos" ADD CONSTRAINT "animal_todos_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_animal_todos_animal_id" ON "animal_todos" USING btree ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_animal_todos_is_completed" ON "animal_todos" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "idx_animal_todos_due_date" ON "animal_todos" USING btree ("due_date");