"use server";

import { db } from "@/lib/db";
import { contactSubmissions } from "@/lib/db/schema";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Naam moet minstens 2 tekens bevatten"),
  email: z.string().email("Ongeldig e-mailadres"),
  phone: z.string().optional(),
  subject: z.enum(
    ["adoptie", "vrijwilliger", "donatie", "gevonden", "info", "afstaan"],
    { message: "Kies een onderwerp" }
  ),
  message: z
    .string()
    .min(10, "Bericht moet minstens 10 tekens bevatten"),
});

export type ContactFormState = {
  success: boolean;
  errors?: Record<string, string[]>;
  message?: string;
};

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    subject: formData.get("subject") as string,
    message: formData.get("message") as string,
  };

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await db.insert(contactSubmissions).values({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });

    return {
      success: true,
      message: "Bedankt voor je bericht! We nemen zo snel mogelijk contact met je op.",
    };
  } catch {
    return {
      success: false,
      message: "Er ging iets mis. Probeer het later opnieuw.",
    };
  }
}
