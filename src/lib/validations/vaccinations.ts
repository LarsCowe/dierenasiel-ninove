import { z } from "zod";

export const VACCINATION_TYPES = ["DHP", "Kennelhoest", "L4"] as const;

export const vaccinationSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  type: z.enum(VACCINATION_TYPES, { message: "Ongeldig vaccinatietype" }),
  date: z.string().min(1, "Datum is verplicht").regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldig datumformaat"),
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldig datumformaat").optional().or(z.literal("")),
  givenByShelter: z.boolean().optional().default(true),
  notes: z.string().max(2000, "Opmerkingen mogen max. 2000 tekens zijn").optional(),
});

export type VaccinationInput = z.infer<typeof vaccinationSchema>;
