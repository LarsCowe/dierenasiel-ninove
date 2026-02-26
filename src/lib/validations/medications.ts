import { z } from "zod";

export const medicationSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  medicationName: z.string()
    .min(1, "Medicatienaam is verplicht")
    .max(200, "Medicatienaam mag max. 200 tekens zijn"),
  dosage: z.string()
    .min(1, "Dosering is verplicht")
    .max(100, "Dosering mag max. 100 tekens zijn"),
  quantity: z.string()
    .max(100, "Hoeveelheid mag max. 100 tekens zijn")
    .optional(),
  startDate: z.string()
    .min(1, "Startdatum is verplicht")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldig datumformaat"),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldig datumformaat")
    .optional()
    .or(z.literal("")),
  notes: z.string()
    .max(2000, "Opmerkingen mogen max. 2000 tekens zijn")
    .optional(),
});

export type MedicationInput = z.infer<typeof medicationSchema>;
