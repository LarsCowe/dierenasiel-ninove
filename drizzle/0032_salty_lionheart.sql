ALTER TABLE "adoption_candidates" ADD COLUMN "retention_flagged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "adoption_candidates" ADD COLUMN "retention_extended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "adoption_candidates" ADD COLUMN "retention_extension_reason" text;--> statement-breakpoint
ALTER TABLE "walkers" ADD COLUMN "retention_flagged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "walkers" ADD COLUMN "retention_extended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "walkers" ADD COLUMN "retention_extension_reason" text;