"use server";

import { db } from "@/lib/db";
import { animals, kennels } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { assignKennelSchema } from "@/lib/validations/kennels";
import type { ActionResult } from "@/types";

export async function assignKennel(
  animalId: number,
  kennelId: number | null,
): Promise<ActionResult> {
  const permCheck = await requirePermission("kennel:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const parsed = assignKennelSchema.safeParse({ animalId, kennelId });
  if (!parsed.success) {
    return {
      success: false,
      error: "Ongeldige invoer",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    // Lookup animal
    const [animal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, parsed.data.animalId))
      .limit(1);

    if (!animal) {
      return { success: false, error: "Dier niet gevonden" };
    }

    let capacityWarning: string | undefined;

    if (parsed.data.kennelId !== null) {
      // Lookup kennel
      const [kennel] = await db
        .select()
        .from(kennels)
        .where(eq(kennels.id, parsed.data.kennelId))
        .limit(1);

      if (!kennel) {
        return { success: false, error: "Kennel niet gevonden" };
      }

      // Check capacity
      const [occupancy] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(animals)
        .where(sql`${animals.kennelId} = ${parsed.data.kennelId} AND ${animals.isInShelter} = true`)
        .limit(1);

      if (occupancy && occupancy.count >= kennel.capacity) {
        capacityWarning = `Let op: kennel ${kennel.code} is vol (${occupancy.count}/${kennel.capacity})`;
      }
    }

    const [updated] = await db
      .update(animals)
      .set({ kennelId: parsed.data.kennelId, updatedAt: new Date() })
      .where(eq(animals.id, parsed.data.animalId))
      .returning();

    await logAudit("assign_kennel", "animal", parsed.data.animalId, animal, updated);
    revalidatePath("/beheerder/dieren/kennel");
    revalidatePath(`/beheerder/dieren/${parsed.data.animalId}`);

    return {
      success: true,
      data: undefined,
      message: capacityWarning,
    };
  } catch (err) {
    console.error("assignKennel failed:", err);
    return { success: false, error: "Er ging iets mis bij het toewijzen van de kennel" };
  }
}
