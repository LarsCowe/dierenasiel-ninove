ALTER TABLE "shelter_settings" DROP CONSTRAINT "shelter_settings_pkey";--> statement-breakpoint
ALTER TABLE "shelter_settings" ALTER COLUMN "value" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "shelter_settings" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "shelter_settings" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "shelter_settings" ADD CONSTRAINT "shelter_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shelter_settings" ADD CONSTRAINT "shelter_settings_key_unique" UNIQUE("key");