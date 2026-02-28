CREATE TABLE "animal_workflow_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"animal_id" integer NOT NULL,
	"from_phase" varchar(50),
	"to_phase" varchar(50) NOT NULL,
	"changed_by" integer NOT NULL,
	"change_reason" text,
	"auto_actions_triggered" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "animal_workflow_history" ADD CONSTRAINT "animal_workflow_history_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "animal_workflow_history" ADD CONSTRAINT "animal_workflow_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_workflow_history_animal_id" ON "animal_workflow_history" USING btree ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_history_created_at" ON "animal_workflow_history" USING btree ("created_at");