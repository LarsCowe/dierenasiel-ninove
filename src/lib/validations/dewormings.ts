import { z } from "zod";

export const DEWORMING_TYPES = ["Canicantel", "Dogninth", "Catminth"] as const;

export const dewormingSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  type: z.enum(DEWORMING_TYPES, { message: "Ongeldig ontwormingstype" }),
  date: z.string().min(1, "Datum is verplicht"),
  notes: z.string().optional(),
});

export type DewormingInput = z.infer<typeof dewormingSchema>;
