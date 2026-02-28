import { z } from "zod";

export const walkBookingSchema = z.object({
  animalId: z.coerce.number().positive("Selecteer een hond"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldige datum"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Ongeldig tijdstip"),
  remarks: z.string().optional().default(""),
});

export type WalkBookingInput = z.infer<typeof walkBookingSchema>;
