"use server";

import { db } from "@/lib/db";
import { surrenderRequests } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const surrenderSchema = z.object({
  email: z.string().email("Ongeldig e-mailadres"),
  species: z.string().min(1, "Kies een diersoort"),
  ownerName: z.string().min(1, "Naam is verplicht").max(200),
  address: z.string().min(1, "Adres is verplicht"),
  postalCode: z.string().min(1, "Postcode en gemeente is verplicht"),
  phone: z.string().min(1, "Gsm nummer is verplicht").max(20),
  surrenderReason: z.string().min(1, "Reden van afstand is verplicht"),
  answers: z.record(z.string(), z.unknown()),
  photoUrls: z.array(z.string()).optional(),
});

export type SurrenderResult = {
  success: true;
} | {
  success: false;
  error?: string;
};

export async function submitSurrenderRequest(
  _prev: SurrenderResult | null,
  formData: FormData,
): Promise<SurrenderResult> {
  let raw: unknown;
  try {
    raw = JSON.parse(formData.get("json") as string);
  } catch {
    return { success: false, error: "Ongeldige gegevens" };
  }

  const parsed = surrenderSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Niet alle verplichte velden zijn correct ingevuld.",
    };
  }

  try {
    await db.insert(surrenderRequests).values({
      email: parsed.data.email,
      species: parsed.data.species,
      ownerName: parsed.data.ownerName,
      address: parsed.data.address,
      postalCode: parsed.data.postalCode,
      phone: parsed.data.phone,
      surrenderReason: parsed.data.surrenderReason,
      answers: parsed.data.answers,
      photoUrls: parsed.data.photoUrls ?? [],
    });

    revalidatePath("/beheerder");
    return { success: true };
  } catch (err) {
    console.error("submitSurrenderRequest failed:", err);
    return { success: false, error: "Er ging iets mis. Probeer het later opnieuw." };
  }
}
