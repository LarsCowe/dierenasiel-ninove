import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-mailadres is verplicht")
    .email("Ongeldig e-mailadres"),
  password: z
    .string()
    .min(6, "Wachtwoord moet minstens 6 tekens bevatten"),
});

export type LoginInput = z.infer<typeof loginSchema>;
