CREATE TABLE "adoption_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"animal_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"contract_date" date NOT NULL,
	"payment_amount" varchar(20) NOT NULL,
	"payment_method" varchar(20) NOT NULL,
	"contract_pdf_url" varchar(500),
	"dogid_catid_transfer_deadline" date,
	"dogid_catid_transferred" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "adoption_contracts" ADD CONSTRAINT "adoption_contracts_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adoption_contracts" ADD CONSTRAINT "adoption_contracts_candidate_id_adoption_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."adoption_candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_adoption_contracts_candidate_id" ON "adoption_contracts" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "idx_adoption_contracts_animal_id" ON "adoption_contracts" USING btree ("animal_id");