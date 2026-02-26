import { z } from "zod";

export const VACCINATION_TYPES = ["DHP", "Kennelhoest", "L4"] as const;

export const vaccinationSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  type: z.enum(VACCINATION_TYPES, { message: "Ongeldig vaccinatietype" }),
  date: z.string().min(1, "Datum is verplicht"),
  nextDueDate: z.string().optional(),
  notes: z.string().optional(),
});

export type VaccinationInput = z.infer<typeof vaccinationSchema>;
