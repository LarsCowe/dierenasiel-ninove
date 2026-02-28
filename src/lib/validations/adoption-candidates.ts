import { z } from "zod";

export const questionnaireSchema = z.object({
  woonsituatie: z.enum(["huis_met_tuin", "appartement", "boerderij", "andere"]),
  tuinOmheind: z.boolean().nullable(),
  eerderHuisdieren: z.boolean(),
  huidigeHuisdieren: z.string(),
  kinderenInHuis: z.enum(["geen", "0_5", "6_12", "12_plus"]),
  werkSituatie: z.enum(["voltijds_thuis", "deeltijds", "voltijds_buitenshuis"]),
  uurAlleen: z.string(),
  ervaring: z.string(),
  motivatie: z.string().min(1, "Motivatie is verplicht"),
  opmerkingen: z.string(),
});

export const categorySchema = z.object({
  category: z.enum(["niet_weerhouden", "mogelijks", "goede_kandidaat"]),
});

export const updateStatusSchema = z.object({
  status: z.enum(["screening", "approved", "rejected"]),
});

export const adoptionCandidateSchema = z.object({
  firstName: z.string().min(1, "Voornaam is verplicht").max(100),
  lastName: z.string().min(1, "Achternaam is verplicht").max(100),
  email: z.string().email("Ongeldig e-mailadres").max(200),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  animalId: z.coerce.number().positive("Selecteer een dier"),
  questionnaireAnswers: questionnaireSchema,
  notes: z.string().optional(),
});
