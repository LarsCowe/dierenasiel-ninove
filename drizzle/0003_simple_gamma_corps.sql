CREATE TABLE "animal_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"animal_id" integer NOT NULL,
	"file_url" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"context" varchar(20) DEFAULT 'dossier' NOT NULL,
	"description" varchar(255),
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_animal_attachments_animal_id" ON "animal_attachments" USING btree ("animal_id");