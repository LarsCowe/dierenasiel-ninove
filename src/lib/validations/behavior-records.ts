import { z } from "zod";

const score = z.number().int("Score moet een geheel getal zijn").min(1, "Score moet minstens 1 zijn").max(5, "Score mag maximaal 5 zijn");

export const behaviorChecklistSchema = z.object({
  benaderingHok: score,
  uitHetHok: score,
  wandelingLeiband: score,
  reactieAndereHonden: score,
  reactieMensen: score,
  aanrakingManipulatie: score,
  voedselgedrag: score,
  zindelijk: z.boolean().nullable(),
  aandachtspunten: z.array(z.string()),
});

export const behaviorRecordSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  date: z.string().min(1, "Datum is verplicht"),
  checklist: behaviorChecklistSchema,
  notes: z.string().optional(),
});

export type BehaviorRecordInput = z.infer<typeof behaviorRecordSchema>;
