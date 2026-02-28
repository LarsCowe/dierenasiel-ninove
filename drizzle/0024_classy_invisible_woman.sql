CREATE TABLE "walkers" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"date_of_birth" date NOT NULL,
	"address" text NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(200) NOT NULL,
	"allergies" text,
	"children_walk_along" boolean DEFAULT false NOT NULL,
	"regulations_read" boolean DEFAULT false NOT NULL,
	"barcode" varchar(50),
	"photo_url" varchar(500),
	"is_approved" boolean DEFAULT false NOT NULL,
	"walk_count" integer DEFAULT 0 NOT NULL,
	"is_walking_club_member" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_walkers_status" ON "walkers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_walkers_email" ON "walkers" USING btree ("email");