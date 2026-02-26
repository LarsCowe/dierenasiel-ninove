CREATE TABLE "medication_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"medication_id" integer NOT NULL,
	"administered_at" timestamp NOT NULL,
	"administered_by" varchar(100),
	"administered_by_user_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_administered_by_user_id_users_id_fk" FOREIGN KEY ("administered_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_medication_logs_medication_id" ON "medication_logs" USING btree ("medication_id");--> statement-breakpoint
CREATE INDEX "idx_medication_logs_administered_at" ON "medication_logs" USING btree ("administered_at");