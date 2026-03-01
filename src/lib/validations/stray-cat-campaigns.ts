import { z } from "zod";
import { CAMPAIGN_OUTCOMES, FIV_FELV_STATUSES } from "@/lib/constants";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  const d = new Date(value);
  return !isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

const dateString = z.string()
  .min(1, "Datum is verplicht")
  .regex(dateRegex, "Ongeldige datumnotatie (verwacht JJJJ-MM-DD)")
  .refine(isValidDate, "Ongeldige datum");

export const createCampaignSchema = z.object({
  requestDate: dateString,
  municipality: z.string().trim().min(1, "Gemeente is verplicht").max(200, "Gemeente mag max 200 tekens zijn"),
  address: z.string().trim().min(1, "Adres is verplicht"),
  remarks: z.string().optional().default(""),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const deployCagesSchema = z.object({
  campaignId: z.coerce.number().positive("Ongeldig campagne-ID"),
  cageDeploymentDate: dateString,
  cageNumbers: z.string().trim().min(1, "Kooiennummers zijn verplicht").max(100, "Kooiennummers mag max 100 tekens zijn"),
});

export type DeployCagesInput = z.infer<typeof deployCagesSchema>;

export const registerInspectionSchema = z.object({
  campaignId: z.coerce.number().positive("Ongeldig campagne-ID"),
  inspectionDate: dateString,
  catDescription: z.string().trim().min(1, "Katbeschrijving is verplicht"),
  vetName: z.string().trim().min(1, "Dierenarts is verplicht").max(200, "Dierenarts mag max 200 tekens zijn"),
  cageAtVet: z.string().max(100, "Kooi bij dierenarts mag max 100 tekens zijn").optional().default(""),
});

export type RegisterInspectionInput = z.infer<typeof registerInspectionSchema>;

export const completeCampaignSchema = z.object({
  campaignId: z.coerce.number().positive("Ongeldig campagne-ID"),
  fivStatus: z.enum(FIV_FELV_STATUSES, { message: "Ongeldige FIV-status" }),
  felvStatus: z.enum(FIV_FELV_STATUSES, { message: "Ongeldige FeLV-status" }),
  outcome: z.enum(CAMPAIGN_OUTCOMES, { message: "Ongeldige uitkomst" }),
  remarks: z.string().optional().default(""),
});

export type CompleteCampaignInput = z.infer<typeof completeCampaignSchema>;

export const linkAnimalSchema = z.object({
  campaignId: z.coerce.number().positive("Ongeldig campagne-ID"),
  linkedAnimalId: z.coerce.number().positive("Ongeldig dier-ID"),
});

export type LinkAnimalInput = z.infer<typeof linkAnimalSchema>;
