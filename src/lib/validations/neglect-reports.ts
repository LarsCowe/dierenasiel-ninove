import { z } from "zod";

export const neglectReportSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  date: z.string().optional(),
  vetName: z.string().optional(),
  healthStatusOnArrival: z.string().min(1, "Gezondheidstoestand bij aankomst is verplicht"),
  neglectFindings: z.string().min(1, "Vaststellingen van verwaarlozing zijn verplicht"),
  treatmentsGiven: z.string().optional(),
  weightOnArrival: z.string().optional(),
  photos: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type NeglectReportInput = z.infer<typeof neglectReportSchema>;
