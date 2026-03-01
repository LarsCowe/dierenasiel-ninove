CREATE TABLE "stray_cat_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_date" date NOT NULL,
	"municipality" varchar(200) NOT NULL,
	"address" text NOT NULL,
	"cage_deployment_date" date,
	"cage_numbers" varchar(100),
	"inspection_date" date,
	"cat_description" text,
	"remarks" text,
	"cage_at_vet" varchar(100),
	"vet_name" varchar(200),
	"fiv_status" varchar(20),
	"felv_status" varchar(20),
	"outcome" varchar(30),
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"linked_animal_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stray_cat_campaigns" ADD CONSTRAINT "stray_cat_campaigns_linked_animal_id_animals_id_fk" FOREIGN KEY ("linked_animal_id") REFERENCES "public"."animals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_stray_cat_campaigns_status" ON "stray_cat_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_stray_cat_campaigns_municipality" ON "stray_cat_campaigns" USING btree ("municipality");--> statement-breakpoint
CREATE INDEX "idx_stray_cat_campaigns_request_date" ON "stray_cat_campaigns" USING btree ("request_date");