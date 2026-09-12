import { z } from "zod";

/**
 * Story 10.64 — het formulier "Terug naar eigenaar". Verplicht is enkel wat het
 * document identificeert: wie (naam eigenaar), wat (naam dier) en wanneer. De rest
 * vult Sven in zoals de eigenaar het aan de balie kan geven.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/;
const DATUM_FOUT = "Ongeldige datumnotatie (verwacht JJJJ-MM-DD)";
const GEEN_DATUM = "Deze datum bestaat niet";

/** JJJJ-MM-DD én een echte kalenderdag: "2026-02-31" mag niet tot aan Postgres raken. */
function bestaandeDatum(v: string): boolean {
  if (!ISO_DATUM.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

const tekst = (max: number) => z.string().trim().max(max, `Maximaal ${max} tekens`).default("");

const optioneleDatum = z
  .string()
  .trim()
  .default("")
  .refine((v) => !v || ISO_DATUM.test(v), DATUM_FOUT)
  .refine((v) => !v || bestaandeDatum(v), GEEN_DATUM);

/** "12,50" → "12.50"; leeg blijft leeg. */
const bedrag = z
  .string()
  .trim()
  .default("")
  .transform((v) => v.replace(",", "."))
  .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), "Geen geldig bedrag")
  .refine((v) => v.length <= 20, "Maximaal 20 tekens"); // kolom total_paid is varchar(20)

export const ownerReturnFormSchema = z.object({
  drawnUpOn: z
    .string()
    .trim()
    .min(1, "Datum van opmaak is verplicht")
    .regex(ISO_DATUM, DATUM_FOUT)
    .refine(bestaandeDatum, GEEN_DATUM),
  drawnUpAt: tekst(100),

  ownerLastName: z.string().trim().min(1, "Familienaam is verplicht").max(100, "Maximaal 100 tekens"),
  ownerFirstName: z.string().trim().min(1, "Voornaam is verplicht").max(100, "Maximaal 100 tekens"),
  ownerStreet: tekst(200),
  ownerPostalCode: tekst(20),
  ownerCity: tekst(100),
  ownerCountry: tekst(100),
  ownerBirthDate: optioneleDatum,
  ownerBirthPlace: tekst(100),
  ownerPhone: tekst(30),
  ownerMobile: tekst(30),
  ownerEmail: tekst(200).refine((v) => !v || EMAIL.test(v), "Geen geldig e-mailadres"),

  animalName: z.string().trim().min(1, "Naam van het dier is verplicht").max(100, "Maximaal 100 tekens"),
  animalSpecies: tekst(50),
  animalBreed: tekst(100),
  animalBirthDate: optioneleDatum,
  animalIdentificationNr: tekst(50),
  animalGender: z.enum(["", "M", "V"], { message: "Kies M of V" }).default(""),
  animalNeutered: z.enum(["", "ja", "nee"], { message: "Kies ja of nee" }).default(""),
  animalPedigree: z.enum(["", "ja", "nee"], { message: "Kies ja of nee" }).default(""),
  animalPassportNr: tekst(100),
  // Kolom is `text`; de fiche-beschrijving die vooringevuld wordt, kan lang zijn.
  animalCoatDescription: tekst(5000),

  stayCosts: tekst(200),
  totalPaid: bedrag,
});

export type OwnerReturnFormInput = z.infer<typeof ownerReturnFormSchema>;
export const OWNER_RETURN_FIELDS = Object.keys(ownerReturnFormSchema.shape) as (keyof OwnerReturnFormInput)[];
