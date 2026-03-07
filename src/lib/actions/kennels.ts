"use server";

import { db } from "@/lib/db";
import { animals, kennels } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { assignKennelSchema, kennelCrudSchema } from "@/lib/validations/kennels";
import type { ActionResult, Kennel } from "@/types";

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

export async function createKennel(
  _prev: ActionResult<Kennel> | null,
  formData: FormData,
): Promise<ActionResult<Kennel>> {
  const permCheck = await requirePermission("kennel:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const raw = {
    code: (formData.get("code") as string) || "",
    zone: (formData.get("zone") as string) || "",
    capacity: formData.get("capacity"),
    notes: (formData.get("notes") as string)?.trim() || undefined,
  };

  const parsed = kennelCrudSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    const [kennel] = await db
      .insert(kennels)
      .values({
        code: parsed.data.code,
        zone: parsed.data.zone,
        capacity: parsed.data.capacity,
        notes: parsed.data.notes || null,
      })
      .returning();

    await logAudit("create_kennel", "kennel", kennel.id, null, kennel);
    revalidatePath("/beheerder/dieren/kennel");

    return { success: true, data: kennel, message: `Kennel ${kennel.code} aangemaakt.` };
  } catch (err: unknown) {
    const pgError = err as { code?: string };
    if (pgError.code === "23505") {
      return { success: false, error: "Er bestaat al een kennel met deze code." };
    }
    return { success: false, error: "Er ging iets mis bij het aanmaken." };
  }
}

export async function deleteKennel(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("kennel:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) {
    return { success: false, error: "Ongeldig kennel-ID" };
  }

  try {
    // Check if kennel has animals
    const [occupancy] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(animals)
      .where(sql`${animals.kennelId} = ${id} AND ${animals.isInShelter} = true`);

    if (occupancy && occupancy.count > 0) {
      return { success: false, error: `Kennel bevat nog ${occupancy.count} dier(en). Verplaats deze eerst.` };
    }

    const [existing] = await db
      .select()
      .from(kennels)
      .where(eq(kennels.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Kennel niet gevonden." };
    }

    await db.delete(kennels).where(eq(kennels.id, id));
    await logAudit("delete_kennel", "kennel", id, existing, null);
    revalidatePath("/beheerder/dieren/kennel");

    return { success: true, data: undefined, message: `Kennel ${existing.code} verwijderd.` };
  } catch {
    return { success: false, error: "Er ging iets mis bij het verwijderen." };
  }
}
