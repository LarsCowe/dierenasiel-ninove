ALTER TABLE "animals" DROP CONSTRAINT "animals_kennel_id_kennels_id_fk";
--> statement-breakpoint
ALTER TABLE "animals" ADD CONSTRAINT "animals_kennel_id_kennels_id_fk" FOREIGN KEY ("kennel_id") REFERENCES "public"."kennels"("id") ON DELETE set null ON UPDATE no action;