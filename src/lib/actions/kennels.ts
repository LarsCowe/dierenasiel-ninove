"use server";

import { db } from "@/lib/db";
import { animals, kennels } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { assignKennelSchema, kennelCrudSchema, type KennelCrudInput } from "@/lib/validations/kennels";
import type { ActionResult, Kennel } from "@/types";

// Story 10.19: zet decimale percentages om naar Drizzle-numeric (string) of null.
function posToNumeric(value: number | string | undefined): string | null {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
}

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
    posX: (formData.get("posX") as string) || undefined,
    posY: (formData.get("posY") as string) || undefined,
    posW: (formData.get("posW") as string) || undefined,
    posH: (formData.get("posH") as string) || undefined,
    layer: (formData.get("layer") as string) || 1,
  };

  const parsed = kennelCrudSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    // Story 10.19+: als de code bestaat maar gedeactiveerd is, reactiveer het
    // bestaande record met de nieuwe waarden — anders blokkeert de unique-index
    // de gebruiker zonder duidelijke escape-route (de inactieve kennel staat
    // niet in de zichtbare lijst).
    const [existing] = await db
      .select()
      .from(kennels)
      .where(eq(kennels.code, parsed.data.code))
      .limit(1);

    if (existing && !existing.isActive) {
      const [reactivated] = await db
        .update(kennels)
        .set({
          isActive: true,
          zone: parsed.data.zone,
          capacity: parsed.data.capacity,
          notes: parsed.data.notes || null,
          posX: posToNumeric(parsed.data.posX),
          posY: posToNumeric(parsed.data.posY),
          posW: posToNumeric(parsed.data.posW),
          posH: posToNumeric(parsed.data.posH),
          layer: parsed.data.layer,
        })
        .where(eq(kennels.id, existing.id))
        .returning();

      await logAudit("reactivate_kennel", "kennel", reactivated.id, existing, reactivated);
      revalidatePath("/beheerder/dieren/kennel");

      return {
        success: true,
        data: reactivated,
        message: `Kennel ${reactivated.code} was inactief — opnieuw geactiveerd met de nieuwe instellingen.`,
      };
    }

    if (existing && existing.isActive) {
      return {
        success: false,
        error: `Er bestaat al een actieve kennel met code "${parsed.data.code}". Kies een andere code.`,
      };
    }

    const [kennel] = await db
      .insert(kennels)
      .values({
        code: parsed.data.code,
        zone: parsed.data.zone,
        capacity: parsed.data.capacity,
        notes: parsed.data.notes || null,
        posX: posToNumeric(parsed.data.posX),
        posY: posToNumeric(parsed.data.posY),
        posW: posToNumeric(parsed.data.posW),
        posH: posToNumeric(parsed.data.posH),
        layer: parsed.data.layer,
      })
      .returning();

    await logAudit("create_kennel", "kennel", kennel.id, null, kennel);
    revalidatePath("/beheerder/dieren/kennel");

    return { success: true, data: kennel, message: `Kennel ${kennel.code} aangemaakt.` };
  } catch (err: unknown) {
    console.error("createKennel failed:", err);
    const pgError = err as { code?: string; cause?: { code?: string }; message?: string };
    const code = pgError.code ?? pgError.cause?.code;
    const message = pgError.message ?? "";
    if (code === "23505" || /duplicate key|unique constraint/i.test(message)) {
      return {
        success: false,
        error: `Er bestaat al een kennel met code "${parsed.data.code}".`,
      };
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

// Story 10.19: bewerken van een bestaande kennel inclusief positie-velden.
export async function updateKennelAction(
  id: number,
  data: KennelCrudInput,
): Promise<ActionResult<Kennel>> {
  const permCheck = await requirePermission("kennel:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const parsed = kennelCrudSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const [existing] = await db
      .select()
      .from(kennels)
      .where(eq(kennels.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Kennel niet gevonden." };
    }

    const [updated] = await db
      .update(kennels)
      .set({
        code: parsed.data.code,
        zone: parsed.data.zone,
        capacity: parsed.data.capacity,
        notes: parsed.data.notes || null,
        posX: posToNumeric(parsed.data.posX),
        posY: posToNumeric(parsed.data.posY),
        posW: posToNumeric(parsed.data.posW),
        posH: posToNumeric(parsed.data.posH),
        layer: parsed.data.layer,
      })
      .where(eq(kennels.id, id))
      .returning();

    await logAudit("update_kennel", "kennel", id, existing, updated);
    revalidatePath("/beheerder/dieren/kennel");

    return { success: true, data: updated, message: `Kennel ${updated.code} bijgewerkt.` };
  } catch (err: unknown) {
    const pgError = err as { code?: string };
    if (pgError.code === "23505") {
      return { success: false, error: "Er bestaat al een kennel met deze code." };
    }
    return { success: false, error: "Er ging iets mis bij het bijwerken." };
  }
}
