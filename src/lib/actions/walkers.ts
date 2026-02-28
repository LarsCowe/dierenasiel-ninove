"use server";

import { db } from "@/lib/db";
import { walkers } from "@/lib/db/schema";
import { walkerRegistrationSchema } from "@/lib/validations/walkers";
import { eq } from "drizzle-orm";
import type { ActionResult } from "@/types";
import type { Walker } from "@/types";

export async function submitWalkerRegistration(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<Walker>> {
  const raw = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    dateOfBirth: formData.get("dateOfBirth") as string,
    address: formData.get("address") as string,
    allergies: (formData.get("allergies") as string) || "",
    childrenWalkAlong: formData.get("childrenWalkAlong") === "true",
    regulationsRead: formData.get("regulationsRead") === "true",
    photoUrl: (formData.get("photoUrl") as string) || "",
  };

  const parsed = walkerRegistrationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    // Check duplicate email
    const existing = await db
      .select()
      .from(walkers)
      .where(eq(walkers.email, parsed.data.email));

    if (existing.length > 0) {
      return {
        success: false,
        error: "Er bestaat al een registratie met dit e-mailadres.",
      };
    }

    // Insert walker
    const [walker] = await db
      .insert(walkers)
      .values({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        dateOfBirth: parsed.data.dateOfBirth,
        address: parsed.data.address,
        allergies: parsed.data.allergies || null,
        childrenWalkAlong: parsed.data.childrenWalkAlong,
        regulationsRead: true,
        photoUrl: raw.photoUrl || null,
        status: "pending",
        isApproved: false,
      })
      .returning();

    // Generate barcode WLK-{id}
    const barcode = `WLK-${walker.id}`;
    const [updated] = await db
      .update(walkers)
      .set({ barcode })
      .where(eq(walkers.id, walker.id))
      .returning();

    return {
      success: true,
      data: updated,
      message: "Bedankt voor je registratie! Je aanvraag wordt zo snel mogelijk behandeld door de coördinator.",
    };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis. Probeer het later opnieuw.",
    };
  }
}
