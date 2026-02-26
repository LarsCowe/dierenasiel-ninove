import { z } from "zod";

export const animalIntakeSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  species: z.enum(["hond", "kat", "ander"], { message: "Kies een soort" }),
  gender: z.string().min(1, "Geslacht is verplicht"),
  breed: z.string().optional(),
  color: z.string().optional(),
  dateOfBirth: z.string().optional(),
  identificationNr: z.string().optional(),
  passportNr: z.string().optional(),
  intakeDate: z.string().min(1, "Intake datum is verplicht"),
  intakeReason: z
    .enum(["afstand", "zwerfhond", "ibn", "vondeling", "overig"])
    .optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  isPickedUpByShelter: z.boolean().optional().default(false),
  dossierNr: z.string().optional(),
  pvNr: z.string().optional(),
  intakeMetadata: z
    .object({
      melderNaam: z.string().optional(),
      melderLocatie: z.string().optional(),
      melderDatum: z.string().optional(),
      betrokkenInstanties: z.string().optional(),
    })
    .optional(),
}).superRefine((data, ctx) => {
  if (data.intakeReason === "ibn") {
    if (!data.dossierNr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Dossiernummer Dierenwelzijn Vlaanderen is verplicht bij IBN",
        path: ["dossierNr"],
      });
    }
    if (!data.pvNr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PV-nummer politie is verplicht bij IBN",
        path: ["pvNr"],
      });
    }
  }
});

export type AnimalIntakeInput = z.infer<typeof animalIntakeSchema>;

export const animalUpdateSchema = z.object({
  id: z.coerce.number().positive("Ongeldig dier-ID"),
  name: z.string().min(1, "Naam is verplicht"),
  aliasName: z.string().optional(),
  breed: z.string().optional(),
  color: z.string().optional(),
  dateOfBirth: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  identificationNr: z.string().optional(),
  passportNr: z.string().optional(),
  barcode: z.string().optional(),
  isOnWebsite: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
});

export type AnimalUpdateInput = z.infer<typeof animalUpdateSchema>;
