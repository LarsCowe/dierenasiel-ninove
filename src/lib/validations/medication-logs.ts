import { z } from "zod";

export const medicationLogSchema = z.object({
  medicationId: z.coerce.number().positive("Ongeldig medicatie-ID"),
  notes: z.string()
    .max(2000, "Opmerkingen mogen max. 2000 tekens zijn")
    .optional()
    .or(z.literal("")),
});

export type MedicationLogInput = z.infer<typeof medicationLogSchema>;
