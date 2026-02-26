ALTER TABLE "animals" ADD COLUMN "color" varchar(100);--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "identification_nr" varchar(50);--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "passport_nr" varchar(50);--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "barcode" varchar(100);--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "is_available_for_adoption" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "is_on_website" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "is_in_shelter" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "kennel_id" integer;--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "intake_reason" varchar(50);--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "is_picked_up_by_shelter" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "intake_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "dossier_nr" varchar(100);--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "pv_nr" varchar(100);--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "ibn_decision_deadline" date;--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "workflow_phase" varchar(50);--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "outtake_date" date;--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "outtake_reason" varchar(50);