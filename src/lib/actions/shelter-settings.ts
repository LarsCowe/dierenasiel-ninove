"use server";

import { db } from "@/lib/db";
import { shelterSettings } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function updateWalkingClubThreshold(
  threshold: number,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Je bent niet ingelogd." };
  }

  if (session.role !== "admin" && session.role !== "coordinator") {
    return { success: false, error: "Je hebt niet de juiste rechten." };
  }

  if (!Number.isInteger(threshold) || threshold <= 0) {
    return { success: false, error: "Drempel moet een positief geheel getal zijn." };
  }

  try {
    await db
      .insert(shelterSettings)
      .values({ key: "walking_club_threshold", value: String(threshold) })
      .onConflictDoUpdate({
        target: shelterSettings.key,
        set: { value: String(threshold), updatedAt: new Date() },
      });

    await logAudit(
      "settings.walking_club_threshold_updated",
      "setting",
      0,
      null,
      { value: String(threshold) },
    );

    revalidatePath("/beheerder/wandelaars");

    return { success: true, data: undefined, message: `Drempel bijgewerkt naar ${threshold} wandelingen.` };
  } catch {
    return { success: false, error: "Er ging iets mis. Probeer het later opnieuw." };
  }
}
