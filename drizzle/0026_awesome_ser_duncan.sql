CREATE TABLE "walks" (
	"id" serial PRIMARY KEY NOT NULL,
	"walker_id" integer NOT NULL,
	"animal_id" integer NOT NULL,
	"date" date NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5),
	"duration_minutes" integer,
	"remarks" text,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "walkers" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "walks" ADD CONSTRAINT "walks_walker_id_walkers_id_fk" FOREIGN KEY ("walker_id") REFERENCES "public"."walkers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "walks" ADD CONSTRAINT "walks_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_walks_walker_id" ON "walks" USING btree ("walker_id");--> statement-breakpoint
CREATE INDEX "idx_walks_animal_id" ON "walks" USING btree ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_walks_date" ON "walks" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_walks_status" ON "walks" USING btree ("status");--> statement-breakpoint
ALTER TABLE "walkers" ADD CONSTRAINT "walkers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_walkers_user_id" ON "walkers" USING btree ("user_id");