import { z } from "zod";

export const createCageSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Kooi-code is verplicht")
    .max(20, "Kooi-code mag max 20 tekens zijn")
    .regex(/^[a-zA-Z0-9_-]+$/, "Alleen letters, cijfers, _ en - toegestaan"),
  notes: z.string().trim().max(500, "Notities mag max 500 tekens zijn").optional().default(""),
});

export type CreateCageInput = z.infer<typeof createCageSchema>;

export const updateCageSchema = createCageSchema.extend({
  id: z.coerce.number().positive("Ongeldig ID"),
});

export type UpdateCageInput = z.infer<typeof updateCageSchema>;
