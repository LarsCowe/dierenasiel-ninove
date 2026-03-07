import { z } from "zod";

export const OPERATION_TYPES = ["steriliseren", "castreren", "tanden_opkuisen", "gezwel_weghalen"] as const;
export const OPERATION_STATUSES = ["gepland", "uitgevoerd", "uitgesteld", "on_hold"] as const;

export const operationSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  type: z.enum(OPERATION_TYPES, { message: "Ongeldig operatietype" }),
  date: z.string().min(1, "Datum is verplicht").regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldig datumformaat"),
  status: z.enum(OPERATION_STATUSES, { message: "Ongeldige status" }).default("gepland"),
  notes: z.string().max(2000, "Opmerkingen mogen max. 2000 tekens zijn").optional(),
});

export type OperationInput = z.infer<typeof operationSchema>;
