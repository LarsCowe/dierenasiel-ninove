import { z } from "zod";

export const feedingQuestionnaireSchema = z.object({
  dieetType: z.string().min(1, "Dieet type is verplicht"),
  merk: z.string().default(""),
  hoeveelheid: z.string().min(1, "Hoeveelheid is verplicht"),
  frequentie: z.string().min(1, "Frequentie is verplicht"),
  allergieen: z.array(z.string()).default([]),
  specifiekeBehoeften: z.string().default(""),
});

export const feedingPlanSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  questionnaire: feedingQuestionnaireSchema,
  notes: z.string().optional(),
});

export type FeedingPlanInput = z.infer<typeof feedingPlanSchema>;
