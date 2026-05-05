import { z } from "zod";

// Story 10.20+: snapshot-velden + nullable candidate (rechtstreekse contracten).
const optionalString = z.string().optional().or(z.literal("").transform(() => undefined));

export const adoptionContractSchema = z.object({
  animalId: z.coerce.number().positive("Selecteer een dier"),
  candidateId: z.coerce.number().positive().optional().nullable(),
  contractDate: z.string().min(1, "Contractdatum is verplicht"),
  paymentAmount: z.string().min(1, "Bedrag is verplicht"),
  paymentMethod: z.enum(["cash", "payconiq", "overschrijving"]),
  notes: z.string().optional(),

  // Adoptant snapshot (verplicht: voornaam + naam, rest optioneel)
  adoptantFirstName: z.string().min(1, "Voornaam is verplicht").max(100),
  adoptantLastName: z.string().min(1, "Naam is verplicht").max(100),
  adoptantEmail: optionalString,
  adoptantPhone: optionalString,
  adoptantAddress: optionalString,
  adoptantBirthDate: optionalString,
  adoptantIdNumber: optionalString,

  // Dier snapshot (alleen naam verplicht)
  animalName: z.string().min(1, "Diernaam is verplicht").max(100),
  animalSpecies: optionalString,
  animalBreed: optionalString,
  animalBirthDate: optionalString,
  animalGender: optionalString,
  animalColor: optionalString,
  animalChipNr: optionalString,
  animalPassportNr: optionalString,
  animalDescription: optionalString,
  animalNeutered: z.boolean().optional(),

  // Story 10.20+: beheerder kan kattenwaarschuwingen (chip/vaccinatie/sterilisatie)
  // bewust overrulen na een confirm-popup.
  overrideCatWarnings: z.boolean().optional(),
});

export type AdoptionContractInput = z.infer<typeof adoptionContractSchema>;
