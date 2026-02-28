import type { animals, animalAttachments, neglectReports, behaviorRecords, feedingPlans, vaccinations, dewormings, vetVisits, operations, medications, medicationLogs, animalTodos, vetInspectionReports, adoptionCandidates, kennismakingen, adoptionContracts, postAdoptionFollowups, kennels, newsArticles, contactSubmissions, kennelSponsors, pages, users, auditLogs, walkers, walks } from "@/lib/db/schema";
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

export type BehaviorRecord = typeof behaviorRecords.$inferSelect;
export type NewBehaviorRecord = typeof behaviorRecords.$inferInsert;

export type FeedingPlan = typeof feedingPlans.$inferSelect;
export type NewFeedingPlan = typeof feedingPlans.$inferInsert;

export interface FeedingQuestionnaire {
  dieetType: string;
  merk: string;
  hoeveelheid: string;
  frequentie: string;
  allergieen: string[];
  specifiekeBehoeften: string;
}

export type Vaccination = typeof vaccinations.$inferSelect;
export type NewVaccination = typeof vaccinations.$inferInsert;

export type Deworming = typeof dewormings.$inferSelect;
export type NewDeworming = typeof dewormings.$inferInsert;

export type VetVisit = typeof vetVisits.$inferSelect;
export type NewVetVisit = typeof vetVisits.$inferInsert;

export type Operation = typeof operations.$inferSelect;
export type NewOperation = typeof operations.$inferInsert;

export type Medication = typeof medications.$inferSelect;
export type NewMedication = typeof medications.$inferInsert;

export type MedicationLog = typeof medicationLogs.$inferSelect;
export type NewMedicationLog = typeof medicationLogs.$inferInsert;

export type AnimalTodo = typeof animalTodos.$inferSelect;
export type NewAnimalTodo = typeof animalTodos.$inferInsert;

export interface MedicalAlert {
  category: "vaccination" | "medication";
  animalId: number;
  animalName: string;
  label: string;
  dueDate: string;
}

export interface BehaviorChecklist {
  benaderingHok: number;       // 1-5: Reactie bij nadering hok
  uitHetHok: number;           // 1-5: Gedrag bij uit hok halen
  wandelingLeiband: number;    // 1-5: Wandeling aan de leiband
  reactieAndereHonden: number; // 1-5: Reactie op andere honden
  reactieMensen: number;       // 1-5: Reactie op mensen/kinderen
  aanrakingManipulatie: number; // 1-5: Aanraking/manipulatie
  voedselgedrag: number;       // 1-5: Voedselgedrag/resource guarding
  zindelijk: boolean | null;   // Zindelijk ja/nee/onbekend
  aandachtspunten: string[];   // Multi-select aandachtspunten
}

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

export type VetInspectionReport = typeof vetInspectionReports.$inferSelect;
export type NewVetInspectionReport = typeof vetInspectionReports.$inferInsert;

export interface TreatedAnimalEntry {
  animalId: number;
  animalName: string;
  species: string;
  chipNr: string | null;
  diagnosis: string;
  treatment: string;
}

export interface EuthanizedAnimalEntry {
  animalId: number;
  animalName: string;
  species: string;
  chipNr: string | null;
  reason: string;
}

export interface AbnormalBehaviorEntry {
  animalId: number;
  animalName: string;
  species: string;
  chipNr: string | null;
  description: string;
}

export type AdoptionCandidate = typeof adoptionCandidates.$inferSelect;
export type NewAdoptionCandidate = typeof adoptionCandidates.$inferInsert;

export interface QuestionnaireAnswers {
  woonsituatie: string;        // "huis_met_tuin" | "appartement" | "boerderij" | "andere"
  tuinOmheind: boolean | null; // Alleen relevant bij tuin
  eerderHuisdieren: boolean;
  huidigeHuisdieren: string;   // Vrij tekstveld
  kinderenInHuis: string;      // "geen" | "0_5" | "6_12" | "12_plus"
  werkSituatie: string;        // "voltijds_thuis" | "deeltijds" | "voltijds_buitenshuis"
  uurAlleen: string;           // Geschat aantal uur per dag alleen
  ervaring: string;            // Vrij tekstveld — ervaring met dieren
  motivatie: string;           // Vrij tekstveld — waarom dit dier
  opmerkingen: string;         // Vrij tekstveld — extra opmerkingen
}

export type Kennismaking = typeof kennismakingen.$inferSelect;
export type NewKennismaking = typeof kennismakingen.$inferInsert;

export type AdoptionContract = typeof adoptionContracts.$inferSelect;
export type NewAdoptionContract = typeof adoptionContracts.$inferInsert;

export type PostAdoptionFollowup = typeof postAdoptionFollowups.$inferSelect;
export type NewPostAdoptionFollowup = typeof postAdoptionFollowups.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type Walker = typeof walkers.$inferSelect;
export type NewWalker = typeof walkers.$inferInsert;

export type Walk = typeof walks.$inferSelect;
export type NewWalk = typeof walks.$inferInsert;
