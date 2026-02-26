import { pgTable, serial, varchar, text, integer, boolean, timestamp, unique, date, jsonb, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const contactSubmissions = pgTable("contact_submissions", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	email: varchar({ length: 200 }).notNull(),
	phone: varchar({ length: 50 }),
	subject: varchar({ length: 100 }).notNull(),
	message: text().notNull(),
	animalId: integer("animal_id"),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const kennelSponsors = pgTable("kennel_sponsors", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	logoUrl: varchar("logo_url", { length: 500 }),
	websiteUrl: varchar("website_url", { length: 500 }),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const newsArticles = pgTable("news_articles", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	excerpt: varchar({ length: 500 }),
	content: text().notNull(),
	imageUrl: varchar("image_url", { length: 500 }),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	isPublished: boolean("is_published").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("news_articles_slug_unique").on(table.slug),
]);

export const pages = pgTable("pages", {
	id: serial().primaryKey().notNull(),
	slug: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	metaDescription: varchar("meta_description", { length: 300 }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("pages_slug_unique").on(table.slug),
]);

export const animals = pgTable("animals", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	species: varchar({ length: 50 }).notNull(),
	breed: varchar({ length: 100 }),
	gender: varchar({ length: 20 }).notNull(),
	dateOfBirth: date("date_of_birth"),
	isNeutered: boolean("is_neutered").default(false),
	description: text().notNull(),
	shortDescription: varchar("short_description", { length: 300 }),
	imageUrl: varchar("image_url", { length: 500 }),
	status: varchar({ length: 30 }).default('beschikbaar'),
	badge: varchar({ length: 30 }),
	isFeatured: boolean("is_featured").default(false),
	intakeDate: date("intake_date"),
	adoptedDate: date("adopted_date"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	images: text().array(),
	color: varchar({ length: 100 }),
	identificationNr: varchar("identification_nr", { length: 50 }),
	passportNr: varchar("passport_nr", { length: 50 }),
	barcode: varchar({ length: 100 }),
	isAvailableForAdoption: boolean("is_available_for_adoption").default(false),
	isOnWebsite: boolean("is_on_website").default(false),
	isInShelter: boolean("is_in_shelter").default(true),
	kennelId: integer("kennel_id"),
	intakeReason: varchar("intake_reason", { length: 50 }),
	isPickedUpByShelter: boolean("is_picked_up_by_shelter").default(false),
	intakeMetadata: jsonb("intake_metadata"),
	dossierNr: varchar("dossier_nr", { length: 100 }),
	pvNr: varchar("pv_nr", { length: 100 }),
	ibnDecisionDeadline: date("ibn_decision_deadline"),
	workflowPhase: varchar("workflow_phase", { length: 50 }),
	outtakeDate: date("outtake_date"),
	outtakeReason: varchar("outtake_reason", { length: 50 }),
	aliasName: varchar("alias_name", { length: 100 }),
}, (table) => [
	unique("animals_slug_unique").on(table.slug),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	name: varchar({ length: 200 }).notNull(),
	role: varchar({ length: 20 }).notNull(),
	isActive: boolean("is_active").default(true),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const auditLogs = pgTable("audit_logs", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	action: varchar({ length: 100 }).notNull(),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: integer("entity_id").notNull(),
	oldValue: jsonb("old_value"),
	newValue: jsonb("new_value"),
	ipAddress: varchar("ip_address", { length: 45 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_audit_logs_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_audit_logs_entity").using("btree", table.entityType.asc().nullsLast().op("int4_ops"), table.entityId.asc().nullsLast().op("int4_ops")),
	index("idx_audit_logs_user").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
]);
