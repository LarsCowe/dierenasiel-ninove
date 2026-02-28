"use server";

import { db } from "@/lib/db";
import { walks, walkers, animals } from "@/lib/db/schema";
import { walkBookingSchema } from "@/lib/validations/walks";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type { ActionResult } from "@/types";
import type { Walk } from "@/types";

export async function bookWalk(
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResult<Walk>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Je bent niet ingelogd." };
  }

  if (session.role !== "wandelaar") {
    return { success: false, error: "Alleen wandelaars kunnen wandelingen boeken." };
  }

  // Look up walker profile by userId
  const walkerResults = await db
    .select()
    .from(walkers)
    .where(eq(walkers.userId, session.userId))
    .limit(1);

  if (walkerResults.length === 0) {
    return { success: false, error: "Wandelaar profiel niet gevonden." };
  }

  const walker = walkerResults[0];

  if (walker.status !== "approved") {
    return { success: false, error: "Uw registratie is nog niet goedgekeurd." };
  }

  // Validate input
  const raw = {
    animalId: formData.get("animalId") as string,
    date: formData.get("date") as string,
    startTime: formData.get("startTime") as string,
    remarks: (formData.get("remarks") as string) || "",
  };

  const parsed = walkBookingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    // Verify animal: must be a dog in shelter
    const animalResults = await db
      .select()
      .from(animals)
      .where(eq(animals.id, parsed.data.animalId))
      .limit(1);

    if (animalResults.length === 0) {
      return { success: false, error: "Dier niet gevonden." };
    }

    const animal = animalResults[0];
    if (animal.species !== "hond" || !animal.isInShelter) {
      return { success: false, error: "Dit dier is geen hond in het asiel." };
    }

    // Create walk
    const [walk] = await db
      .insert(walks)
      .values({
        walkerId: walker.id,
        animalId: parsed.data.animalId,
        date: parsed.data.date,
        startTime: parsed.data.startTime,
        endTime: null,
        durationMinutes: null,
        remarks: parsed.data.remarks || null,
        status: "planned",
      })
      .returning();

    await logAudit("walk.booked", "walk", walk.id, null, walk);
    revalidatePath("/wandelaar");

    return {
      success: true,
      data: walk as Walk,
      message: "Wandeling succesvol geboekt!",
    };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis. Probeer het later opnieuw.",
    };
  }
}
