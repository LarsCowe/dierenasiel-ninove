import { z } from "zod";

export const ANIMAL_STATUSES = [
  "beschikbaar",
  "in_behandeling",
  "gereserveerd",
  "geadopteerd",
  "terug_eigenaar",
  "geeuthanaseerd",
] as const;

export type AnimalStatus = (typeof ANIMAL_STATUSES)[number];

// Statuses that can only be set via the outtake flow (not via manual dropdown)
export const TERMINAL_STATUSES: readonly AnimalStatus[] = [
  "geadopteerd",
  "terug_eigenaar",
  "geeuthanaseerd",
];

// Statuses selectable via the manual status dropdown
export const MANUAL_STATUSES = ANIMAL_STATUSES.filter(
  (s) => !(TERMINAL_STATUSES as readonly string[]).includes(s),
);

export const OUTTAKE_REASONS = [
  "adoptie",
  "terug_eigenaar",
  "euthanasie",
] as const;

export type OuttakeReason = (typeof OUTTAKE_REASONS)[number];

export const changeStatusSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  newStatus: z.enum(ANIMAL_STATUSES, {
    message: "Ongeldige status",
  }),
});

export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;

export const registerOuttakeSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  outtakeReason: z.enum(OUTTAKE_REASONS, {
    message: "Ongeldige uitstroomreden",
  }),
  outtakeDate: z.string()
    .min(1, "Uitstroomdatum is verplicht")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldige datumnotatie (verwacht JJJJ-MM-DD)"),
});

export type RegisterOuttakeInput = z.infer<typeof registerOuttakeSchema>;
