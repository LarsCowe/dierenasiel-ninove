import { z } from "zod";

const jaNee = z.boolean().nullable();

export const behaviorChecklistSchema = z.object({
  // Sectie 1: Gedrag tegenover de verzorgers
  verzorgers_algemeenAgressief: jaNee,
  verzorgers_agressiefSpeelgoed: jaNee,
  verzorgers_agressiefVoederkom: jaNee,
  verzorgers_agressiefMand: jaNee,
  verzorgers_gemakkelijkWandeling: jaNee,
  verzorgers_speeltGraag: jaNee,
  verzorgers_andere: z.string().nullable(),
  // Sectie 2: Gedrag tegenover andere honden
  honden_algemeenAgressief: jaNee,
  honden_agressiefSpeelgoed: jaNee,
  honden_agressiefVoederkom: jaNee,
  honden_agressiefMand: jaNee,
  honden_speeltGraag: jaNee,
  honden_andere: z.string().nullable(),
});

export const behaviorRecordSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  date: z.string().min(1, "Datum is verplicht"),
  checklist: behaviorChecklistSchema,
  notes: z.string().optional(),
});

export type BehaviorRecordInput = z.infer<typeof behaviorRecordSchema>;
