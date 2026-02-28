CREATE TABLE "post_adoption_followups" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"followup_type" varchar(20) NOT NULL,
	"date" date NOT NULL,
	"notes" text,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "animal_attachments" ADD COLUMN "followup_id" integer;--> statement-breakpoint
ALTER TABLE "post_adoption_followups" ADD CONSTRAINT "post_adoption_followups_contract_id_adoption_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."adoption_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_post_adoption_followups_contract_id" ON "post_adoption_followups" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_post_adoption_followups_status_date" ON "post_adoption_followups" USING btree ("status","date");--> statement-breakpoint
ALTER TABLE "animal_attachments" ADD CONSTRAINT "animal_attachments_followup_id_post_adoption_followups_id_fk" FOREIGN KEY ("followup_id") REFERENCES "public"."post_adoption_followups"("id") ON DELETE set null ON UPDATE no action;