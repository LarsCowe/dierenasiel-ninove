import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  date,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const animals = pgTable("animals", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
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
  intakeDate: date("intake_date"),
  adoptedDate: date("adopted_date"),
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
