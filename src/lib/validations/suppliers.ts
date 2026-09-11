import { z } from "zod";
import { normalizeWebsite } from "@/lib/events/suppliers";

/**
 * Story 13.16 — één leverancier uit de lijst. Enkel de naam is verplicht: vaak weet je
 * eerst alleen bij wie je iets bestelt, en komt het nummer later.
 */
const leegIsNull = (v: string | undefined) => (v ? v : null);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const supplierSchema = z.object({
  name: z.string().trim().min(1, "Naam is verplicht").max(120, "Maximaal 120 tekens"),
  phone: z.string().trim().max(30, "Maximaal 30 tekens").optional().transform(leegIsNull),
  email: z
    .string()
    .trim()
    .max(200, "Maximaal 200 tekens")
    .optional()
    .refine((v) => !v || EMAIL.test(v), "Geen geldig e-mailadres")
    .transform(leegIsNull),
  // 290 i.p.v. 300: er kan nog "https://" bij komen.
  website: z
    .string()
    .trim()
    .max(290, "Maximaal 290 tekens")
    .optional()
    .transform((v) => normalizeWebsite(v)),
  notes: z.string().trim().optional().transform(leegIsNull),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
