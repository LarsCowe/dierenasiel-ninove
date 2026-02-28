import { z } from "zod";

export const walkerRegistrationSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "Voornaam is verplicht")
      .max(100, "Voornaam mag maximaal 100 tekens bevatten"),
    lastName: z
      .string()
      .min(1, "Achternaam is verplicht")
      .max(100, "Achternaam mag maximaal 100 tekens bevatten"),
    email: z.string().email("Ongeldig e-mailadres"),
    phone: z
      .string()
      .min(1, "Telefoonnummer is verplicht")
      .max(20, "Telefoonnummer mag maximaal 20 tekens bevatten"),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Geboortedatum moet in JJJJ-MM-DD formaat"),
    address: z.string().min(1, "Adres is verplicht"),
    allergies: z.string().optional().default(""),
    childrenWalkAlong: z.boolean().default(false),
    regulationsRead: z.literal(true, {
      error: "Je moet het wandelreglement accepteren",
    }),
  })
  .refine(
    (data) => {
      const dob = new Date(data.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      const dayDiff = today.getDate() - dob.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      return actualAge >= 18;
    },
    {
      message: "Je moet minstens 18 jaar oud zijn",
      path: ["dateOfBirth"],
    },
  );

export type WalkerRegistrationInput = z.infer<typeof walkerRegistrationSchema>;
