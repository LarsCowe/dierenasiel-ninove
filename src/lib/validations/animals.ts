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
  intakeMetadata: z
    .object({
      melderNaam: z.string().optional(),
      melderLocatie: z.string().optional(),
      melderDatum: z.string().optional(),
    })
    .optional(),
});

export type AnimalIntakeInput = z.infer<typeof animalIntakeSchema>;
