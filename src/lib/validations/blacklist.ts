import { z } from "zod";

export const createBlacklistEntrySchema = z.object({
  firstName: z.string().trim().min(1, "Voornaam is verplicht").max(100, "Voornaam mag max 100 tekens zijn"),
  lastName: z.string().trim().min(1, "Achternaam is verplicht").max(100, "Achternaam mag max 100 tekens zijn"),
  address: z.string().trim().optional(),
  reason: z.string().trim().min(1, "Reden is verplicht"),
});

export type CreateBlacklistEntryInput = z.infer<typeof createBlacklistEntrySchema>;

export const updateBlacklistEntrySchema = createBlacklistEntrySchema.extend({
  id: z.coerce.number().positive("Ongeldig ID"),
});

export type UpdateBlacklistEntryInput = z.infer<typeof updateBlacklistEntrySchema>;
