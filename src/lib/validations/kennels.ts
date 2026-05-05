import { z } from "zod";

export const KENNEL_ZONES = ["honden", "katten", "andere"] as const;

export const assignKennelSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  kennelId: z.coerce.number().positive("Ongeldig kennel-ID").nullable(),
});

export type AssignKennelInput = z.infer<typeof assignKennelSchema>;

// Story 10.19: optionele positie-velden (percentages 0-100). Lege string of
// undefined betekent "geen positie" — kennel verschijnt dan niet op het plan.
const positionField = z
  .union([
    z
      .number()
      .min(0, "Min. 0")
      .max(100, "Max. 100"),
    z
      .string()
      .trim()
      .transform((val, ctx) => {
        if (val === "") return undefined;
        const n = Number(val.replace(",", "."));
        if (Number.isNaN(n)) {
          ctx.addIssue({ code: "custom", message: "Ongeldig getal" });
          return z.NEVER;
        }
        if (n < 0 || n > 100) {
          ctx.addIssue({ code: "custom", message: "Tussen 0 en 100" });
          return z.NEVER;
        }
        return n;
      }),
  ])
  .optional();

export const kennelCrudSchema = z.object({
  code: z.string().trim().min(1, "Code is verplicht").max(10, "Code mag max. 10 tekens zijn"),
  zone: z.enum(KENNEL_ZONES, { error: "Selecteer een zone" }),
  capacity: z.coerce.number().int().min(1, "Capaciteit moet minstens 1 zijn").max(20, "Capaciteit mag max. 20 zijn"),
  notes: z.string().max(500, "Opmerkingen mag max. 500 tekens zijn").optional(),
  posX: positionField,
  posY: positionField,
  posW: positionField,
  posH: positionField,
  // Story 10.19+: laagnummer voor gestapelde hokken (1-9).
  layer: z.coerce.number().int().min(1, "Min. 1").max(9, "Max. 9").default(1),
});

// Story 10.19: gebruik input-type — UI levert strings/numbers aan, transform doet de rest.
export type KennelCrudInput = z.input<typeof kennelCrudSchema>;
export type KennelCrudParsed = z.infer<typeof kennelCrudSchema>;

export const kennelUpdateSchema = kennelCrudSchema.extend({
  id: z.coerce.number().int().positive("Ongeldig kennel-ID"),
});

export type KennelUpdateInput = z.infer<typeof kennelUpdateSchema>;
