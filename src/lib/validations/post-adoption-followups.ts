import { z } from "zod";

export const updateFollowupSchema = z.object({
  id: z.coerce.number().positive("Ongeldig ID"),
  status: z.enum(["completed", "no_response"], { message: "Ongeldige status" }),
  notes: z.string().max(5000, "Notities mogen max. 5000 tekens zijn").optional(),
});

export type UpdateFollowupInput = z.infer<typeof updateFollowupSchema>;

export const createCustomFollowupSchema = z.object({
  contractId: z.coerce.number().positive("Ongeldig contract-ID"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldige datum (verwacht YYYY-MM-DD)"),
  notes: z.string().max(5000, "Notities mogen max. 5000 tekens zijn").optional(),
});

export type CreateCustomFollowupInput = z.infer<typeof createCustomFollowupSchema>;
