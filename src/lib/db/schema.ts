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
  unique,
} from "drizzle-orm/pg-core";

export const kennels = pgTable("kennels", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).unique().notNull(),
  zone: varchar("zone", { length: 20 }).notNull(), // 'honden', 'katten', 'andere'
  capacity: integer("capacity").notNull().default(2),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
});

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
  kennelId: integer("kennel_id").references(() => kennels.id, { onDelete: "set null" }),
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
  animalId: integer("animal_id").notNull().references(() => animals.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  context: varchar("context", { length: 20 }).default("dossier").notNull(),
  description: varchar("description", { length: 255 }),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
}, (table) => [
  index("idx_animal_attachments_animal_id").on(table.animalId),
]);

export const neglectReports = pgTable("neglect_reports", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animals.id, { onDelete: "cascade" }),
  date: date("date"),
  vetName: varchar("vet_name", { length: 200 }),
  healthStatusOnArrival: text("health_status_on_arrival").notNull(),
  neglectFindings: text("neglect_findings").notNull(),
  treatmentsGiven: text("treatments_given"),
  weightOnArrival: varchar("weight_on_arrival", { length: 50 }),
  photos: text("photos").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("neglect_reports_animal_id_unique").on(table.animalId),
  index("idx_neglect_reports_animal_id").on(table.animalId),
]);

export const behaviorRecords = pgTable("behavior_records", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animals.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  checklist: jsonb("checklist").notNull(),
  notes: text("notes"),
  recordedBy: integer("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_behavior_records_animal_id").on(table.animalId),
]);

export const feedingPlans = pgTable("feeding_plans", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animals.id, { onDelete: "cascade" }),
  questionnaire: jsonb("questionnaire").notNull(),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("feeding_plans_animal_id_unique").on(table.animalId),
  index("idx_feeding_plans_animal_id").on(table.animalId),
]);

export const vaccinations = pgTable("vaccinations", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animals.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  date: date("date").notNull(),
  nextDueDate: date("next_due_date"),
  administeredBy: integer("administered_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_vaccinations_animal_id").on(table.animalId),
]);

export const dewormings = pgTable("dewormings", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animals.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_dewormings_animal_id").on(table.animalId),
]);

export const vetVisits = pgTable("vet_visits", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animals.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  location: varchar("location", { length: 50 }).notNull(),
  complaints: text("complaints"),
  todo: text("todo"),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  recordedBy: integer("recorded_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_vet_visits_animal_id").on(table.animalId),
]);

export const operations = pgTable("operations", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animals.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  date: date("date").notNull(),
  recordedBy: integer("recorded_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_operations_animal_id").on(table.animalId),
]);

export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  animalId: integer("animal_id").notNull().references(() => animals.id, { onDelete: "cascade" }),
  medicationName: varchar("medication_name", { length: 200 }).notNull(),
  dosage: varchar("dosage", { length: 100 }).notNull(),
  quantity: varchar("quantity", { length: 100 }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  recordedBy: integer("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_medications_animal_id").on(table.animalId),
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
