import { z } from "zod";

export const VET_VISIT_LOCATIONS = ["in_asiel", "in_praktijk"] as const;

export const vetVisitSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  date: z.string().min(1, "Datum is verplicht").regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldig datumformaat"),
  location: z.enum(VET_VISIT_LOCATIONS, { message: "Ongeldige locatie" }),
  complaints: z.string().max(2000, "Klachten mogen max. 2000 tekens zijn").optional(),
  todo: z.string().max(2000, "Todo mag max. 2000 tekens zijn").optional(),
  notes: z.string().max(2000, "Opmerkingen mogen max. 2000 tekens zijn").optional(),
});

export type VetVisitInput = z.infer<typeof vetVisitSchema>;
