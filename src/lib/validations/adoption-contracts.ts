import { z } from "zod";

export const adoptionContractSchema = z.object({
  animalId: z.coerce.number().positive("Selecteer een dier"),
  candidateId: z.coerce.number().positive("Selecteer een kandidaat"),
  contractDate: z.string().min(1, "Contractdatum is verplicht"),
  paymentAmount: z.string().min(1, "Bedrag is verplicht"),
  paymentMethod: z.enum(["cash", "payconiq", "overschrijving"]),
  notes: z.string().optional(),
});
