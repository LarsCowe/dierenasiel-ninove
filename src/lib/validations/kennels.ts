import { z } from "zod";

export const assignKennelSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  kennelId: z.coerce.number().positive("Ongeldig kennel-ID").nullable(),
});

export type AssignKennelInput = z.infer<typeof assignKennelSchema>;
