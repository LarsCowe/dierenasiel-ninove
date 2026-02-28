import { z } from "zod";

export const kennismakingSchema = z.object({
  adoptionCandidateId: z.coerce.number().positive("Selecteer een kandidaat"),
  animalId: z.coerce.number().positive("Selecteer een dier"),
  scheduledAt: z.string().min(1, "Datum en tijd zijn verplicht"),
  location: z.string().max(200).optional(),
});

export const kennismakingOutcomeSchema = z.object({
  outcome: z.enum(["positief", "twijfel"]),
  notes: z.string().optional(),
});
