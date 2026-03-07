import { z } from "zod";

export const KENNEL_ZONES = ["honden", "katten", "andere"] as const;

export const assignKennelSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  kennelId: z.coerce.number().positive("Ongeldig kennel-ID").nullable(),
});

export type AssignKennelInput = z.infer<typeof assignKennelSchema>;

export const kennelCrudSchema = z.object({
  code: z.string().trim().min(1, "Code is verplicht").max(10, "Code mag max. 10 tekens zijn"),
  zone: z.enum(KENNEL_ZONES, { error: "Selecteer een zone" }),
  capacity: z.coerce.number().int().min(1, "Capaciteit moet minstens 1 zijn").max(20, "Capaciteit mag max. 20 zijn"),
  notes: z.string().max(500, "Opmerkingen mag max. 500 tekens zijn").optional(),
});

export type KennelCrudInput = z.infer<typeof kennelCrudSchema>;
