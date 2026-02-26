import type { animals, animalAttachments, neglectReports, kennels, newsArticles, contactSubmissions, kennelSponsors, pages, users, auditLogs } from "@/lib/db/schema";
import { BACKOFFICE_ROLES } from "@/lib/constants";

// Standard return type for all Server Actions
export type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error?: string; fieldErrors?: Record<string, string[]> };

// Backoffice roles — derived from BACKOFFICE_ROLES constant (single source of truth)
export type BackofficeRole = (typeof BACKOFFICE_ROLES)[number];

export type Animal = typeof animals.$inferSelect;
export type NewAnimal = typeof animals.$inferInsert;

export type AnimalAttachment = typeof animalAttachments.$inferSelect;
export type NewAnimalAttachment = typeof animalAttachments.$inferInsert;

export type NeglectReport = typeof neglectReports.$inferSelect;
export type NewNeglectReport = typeof neglectReports.$inferInsert;

export type Kennel = typeof kennels.$inferSelect;
export type NewKennel = typeof kennels.$inferInsert;

export type NewsArticle = typeof newsArticles.$inferSelect;
export type NewNewsArticle = typeof newsArticles.$inferInsert;

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type NewContactSubmission = typeof contactSubmissions.$inferInsert;

export type KennelSponsor = typeof kennelSponsors.$inferSelect;
export type NewKennelSponsor = typeof kennelSponsors.$inferInsert;

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
