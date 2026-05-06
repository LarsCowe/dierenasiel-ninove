"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { cages } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import {
  getCageById,
  getCageByCode,
} from "@/lib/queries/cages";
import { getOccupiedCageNumbers } from "@/lib/queries/stray-cat-campaigns";
import {
  createCageSchema,
  updateCageSchema,
} from "@/lib/validations/cages";
import type { ActionResult } from "@/types";

const REVALIDATE_PATH = "/beheerder/dieren/zwerfkattenbeleid/kooien";

async function requireAuth(): Promise<
  | { success: true }
  | { success: false; error: string }
> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };
  if (!hasPermission(session.role, "stray_cat:write"))
    return { success: false, error: "Onvoldoende rechten" };
  return { success: true };
}

export async function createCageAction(
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: number }>> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = createCageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Ongeldige invoer", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const existing = await getCageByCode(parsed.data.code);

    // Soft-deleted kooi met dezelfde code? Reactiveer i.p.v. duplicate-error.
    if (existing && existing.deletedAt) {
      await db
        .update(cages)
        .set({
          notes: parsed.data.notes || null,
          deletedAt: null,
        })
        .where(eq(cages.id, existing.id));

      await logAudit(
        "cage.reactivated",
        "cage",
        existing.id,
        { code: existing.code, notes: existing.notes, deletedAt: existing.deletedAt },
        { code: parsed.data.code, notes: parsed.data.notes, deletedAt: null },
      );

      revalidatePath(REVALIDATE_PATH);
      return { success: true, data: { id: existing.id } };
    }

    if (existing) {
      return { success: false, error: "Een kooi met deze code bestaat al" };
    }

    const inserted = await db
      .insert(cages)
      .values({
        code: parsed.data.code,
        notes: parsed.data.notes || null,
      })
      .returning({ id: cages.id });

    const id = inserted[0]?.id;

    await logAudit(
      "cage.created",
      "cage",
      id,
      null,
      { code: parsed.data.code, notes: parsed.data.notes },
    );

    revalidatePath(REVALIDATE_PATH);
    return { success: true, data: { id } };
  } catch (err) {
    console.error("createCageAction failed:", err);
    return { success: false, error: "Kooi aanmaken mislukt. Probeer opnieuw." };
  }
}

export async function updateCageAction(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = updateCageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Ongeldige invoer", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const existing = await getCageById(parsed.data.id);
    if (!existing || existing.deletedAt) {
      return { success: false, error: "Kooi niet gevonden" };
    }

    // Naam-conflict met een andere actieve kooi?
    if (parsed.data.code.toLowerCase() !== existing.code.toLowerCase()) {
      const conflict = await getCageByCode(parsed.data.code);
      if (conflict && conflict.id !== existing.id && !conflict.deletedAt) {
        return { success: false, error: "Een kooi met deze code bestaat al" };
      }
    }

    await db
      .update(cages)
      .set({
        code: parsed.data.code,
        notes: parsed.data.notes || null,
      })
      .where(eq(cages.id, parsed.data.id));

    await logAudit(
      "cage.updated",
      "cage",
      parsed.data.id,
      { code: existing.code, notes: existing.notes },
      { code: parsed.data.code, notes: parsed.data.notes },
    );

    revalidatePath(REVALIDATE_PATH);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("updateCageAction failed:", err);
    return { success: false, error: "Kooi bijwerken mislukt. Probeer opnieuw." };
  }
}

export async function deleteCageAction(
  id: number,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false, error: auth.error };

  if (!Number.isInteger(id) || id <= 0) {
    return { success: false, error: "Ongeldig ID" };
  }

  try {
    const existing = await getCageById(id);
    if (!existing || existing.deletedAt) {
      return { success: false, error: "Kooi niet gevonden" };
    }

    // Block soft-delete als de kooi momenteel in een actieve campagne is uitgezet.
    const occupied = await getOccupiedCageNumbers();
    const inUseCampaignId = occupied[existing.code];
    if (inUseCampaignId !== undefined) {
      return {
        success: false,
        error: `Kooi ${existing.code} is in gebruik in campagne #${inUseCampaignId} en kan niet verwijderd worden.`,
      };
    }

    // Soft-delete: deletedAt zetten zodat historische campagne-referenties
    // herkenbaar blijven.
    await db
      .update(cages)
      .set({ deletedAt: new Date() })
      .where(eq(cages.id, id));

    await logAudit(
      "cage.deleted",
      "cage",
      id,
      { code: existing.code, notes: existing.notes },
      null,
    );

    revalidatePath(REVALIDATE_PATH);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("deleteCageAction failed:", err);
    return { success: false, error: "Kooi verwijderen mislukt. Probeer opnieuw." };
  }
}
