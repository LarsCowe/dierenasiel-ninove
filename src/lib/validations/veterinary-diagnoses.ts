import { z } from "zod";

export const addDiagnosisSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Diagnose moet minstens 2 tekens bevatten")
    .max(200, "Diagnose mag max 200 tekens zijn"),
});

export type AddDiagnosisInput = z.infer<typeof addDiagnosisSchema>;
