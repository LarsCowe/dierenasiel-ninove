CREATE TABLE "mailing_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"from_email" varchar(200) DEFAULT 'honden@dierenasielninove.be' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mailing_send_recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"send_id" integer NOT NULL,
	"email" varchar(200) NOT NULL,
	"recipient_name" varchar(200) NOT NULL,
	"animal_name" varchar(200),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mailing_sends" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" varchar(500) NOT NULL,
	"template_name" varchar(100) NOT NULL,
	"from_email" varchar(200) NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"sent_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mailing_send_recipients" ADD CONSTRAINT "mailing_send_recipients_send_id_mailing_sends_id_fk" FOREIGN KEY ("send_id") REFERENCES "public"."mailing_sends"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailing_sends" ADD CONSTRAINT "mailing_sends_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_mailing_send_recipients_send_id" ON "mailing_send_recipients" USING btree ("send_id");--> statement-breakpoint
CREATE INDEX "idx_mailing_sends_sent_by" ON "mailing_sends" USING btree ("sent_by");--> statement-breakpoint
CREATE INDEX "idx_mailing_sends_created_at" ON "mailing_sends" USING btree ("created_at");