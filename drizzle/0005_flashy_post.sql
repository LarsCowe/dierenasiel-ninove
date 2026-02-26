CREATE TABLE "kennels" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"zone" varchar(20) NOT NULL,
	"capacity" integer DEFAULT 2 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	CONSTRAINT "kennels_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "animals" ADD CONSTRAINT "animals_kennel_id_kennels_id_fk" FOREIGN KEY ("kennel_id") REFERENCES "public"."kennels"("id") ON DELETE no action ON UPDATE no action;