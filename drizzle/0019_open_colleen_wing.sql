CREATE TABLE "vet_inspection_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"visit_date" date NOT NULL,
	"vet_user_id" integer,
	"vet_name" varchar(200) NOT NULL,
	"vet_signature" boolean DEFAULT false NOT NULL,
	"signed_at" timestamp with time zone,
	"animals_treated" jsonb DEFAULT '[]'::jsonb,
	"animals_euthanized" jsonb DEFAULT '[]'::jsonb,
	"abnormal_behavior" jsonb DEFAULT '[]'::jsonb,
	"recommendations" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "vet_inspection_reports" ADD CONSTRAINT "vet_inspection_reports_vet_user_id_users_id_fk" FOREIGN KEY ("vet_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_vet_inspection_reports_visit_date" ON "vet_inspection_reports" USING btree ("visit_date");