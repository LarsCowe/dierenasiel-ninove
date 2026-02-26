import { z } from "zod";
import { TODO_TYPES, TODO_PRIORITIES } from "@/lib/constants";

export const createAnimalTodoSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  type: z.enum(TODO_TYPES, { message: "Ongeldig type" }),
  description: z.string().min(1, "Beschrijving is verplicht").max(2000, "Beschrijving mag max. 2000 tekens zijn"),
  dueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldige datum")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  priority: z.enum(TODO_PRIORITIES, { message: "Ongeldige prioriteit" }).default("normaal"),
});

export const completeAnimalTodoSchema = z.object({
  id: z.coerce.number().positive("Ongeldig ID"),
});

export type CreateAnimalTodoInput = z.infer<typeof createAnimalTodoSchema>;
export type CompleteAnimalTodoInput = z.infer<typeof completeAnimalTodoSchema>;
