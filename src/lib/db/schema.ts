import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  date,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const animals = pgTable("animals", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  aliasName: varchar("alias_name", { length: 100 }),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  species: varchar("species", { length: 50 }).notNull(),
  breed: varchar("breed", { length: 100 }),
  gender: varchar("gender", { length: 20 }).notNull(),
  dateOfBirth: date("date_of_birth"),
  isNeutered: boolean("is_neutered").default(false),
  description: text("description").notNull(),
  shortDescription: varchar("short_description", { length: 300 }),
  imageUrl: varchar("image_url", { length: 500 }),
  images: text("images").array(),
  status: varchar("status", { length: 30 }).default("beschikbaar"),
  badge: varchar("badge", { length: 30 }),
  isFeatured: boolean("is_featured").default(false),
  color: varchar("color", { length: 100 }),
  identificationNr: varchar("identification_nr", { length: 50 }),
  passportNr: varchar("passport_nr", { length: 50 }),
  barcode: varchar("barcode", { length: 100 }),
  isAvailableForAdoption: boolean("is_available_for_adoption").default(false),
  isOnWebsite: boolean("is_on_website").default(false),
  isInShelter: boolean("is_in_shelter").default(true),
  kennelId: integer("kennel_id"),
  intakeDate: date("intake_date"),
  intakeReason: varchar("intake_reason", { length: 50 }),
  isPickedUpByShelter: boolean("is_picked_up_by_shelter").default(false),
  intakeMetadata: jsonb("intake_metadata"),
  adoptedDate: date("adopted_date"),
  dossierNr: varchar("dossier_nr", { length: 100 }),
  pvNr: varchar("pv_nr", { length: 100 }),
  ibnDecisionDeadline: date("ibn_decision_deadline"),
  workflowPhase: varchar("workflow_phase", { length: 50 }),
  outtakeDate: date("outtake_date"),
  outtakeReason: varchar("outtake_reason", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  excerpt: varchar("excerpt", { length: 500 }),
  content: text("content").notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  publishedAt: timestamp("published_at"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  subject: varchar("subject", { length: 100 }).notNull(),
  message: text("message").notNull(),
  animalId: integer("animal_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const kennelSponsors = pgTable("kennel_sponsors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  logoUrl: varchar("logo_url", { length: 500 }),
  websiteUrl: varchar("website_url", { length: 500 }),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  metaDescription: varchar("meta_description", { length: 300 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // beheerder | medewerker | dierenarts | adoptieconsulent | coördinator | wandelaar | surfer
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const animalAttachments = pgTable("animal_attachments", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  context: varchar("context", { length: 20 }).default("dossier").notNull(),
  description: varchar("description", { length: 255 }),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
}, (table) => [
  index("idx_animal_attachments_animal_id").on(table.animalId),
]);

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: integer("entity_id").notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_audit_logs_entity").on(table.entityType, table.entityId),
  index("idx_audit_logs_user").on(table.userId),
  index("idx_audit_logs_created_at").on(table.createdAt),
]);
