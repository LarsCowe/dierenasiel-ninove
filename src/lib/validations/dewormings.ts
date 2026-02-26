import { z } from "zod";

export const DEWORMING_TYPES = ["Canicantel", "Dogninth", "Catminth"] as const;

export const dewormingSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  type: z.enum(DEWORMING_TYPES, { message: "Ongeldig ontwormingstype" }),
  date: z.string().min(1, "Datum is verplicht").regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldig datumformaat"),
  notes: z.string().max(2000, "Opmerkingen mogen max. 2000 tekens zijn").optional(),
});

export type DewormingInput = z.infer<typeof dewormingSchema>;
