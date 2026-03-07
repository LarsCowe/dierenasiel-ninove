"use server";

import { db } from "@/lib/db";
import { blacklistEntries } from "@/lib/db/schema";
import { requirePermission } from "@/lib/permissions";
import { createBlacklistEntrySchema, updateBlacklistEntrySchema } from "@/lib/validations/blacklist";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type { ActionResult } from "@/types";

export async function createBlacklistEntry(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("adoption:write");
  if (permCheck) return permCheck;

  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    address: formData.get("address") || undefined,
    reason: formData.get("reason"),
  };

  const parsed = createBlacklistEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validatie mislukt",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  await db.insert(blacklistEntries).values({
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    address: parsed.data.address || null,
    reason: parsed.data.reason,
    addedBy: "beheerder",
  }).returning();

  revalidatePath("/beheerder/adoptie");
  revalidatePath("/beheerder/adoptie/zwarte-lijst");
  return { success: true, data: undefined, message: "Item toegevoegd aan zwarte lijst." };
}

export async function updateBlacklistEntry(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("adoption:write");
  if (permCheck) return permCheck;

  const raw = {
    id: formData.get("id"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    address: formData.get("address") || undefined,
    reason: formData.get("reason"),
  };

  const parsed = updateBlacklistEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validatie mislukt",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  await db
    .update(blacklistEntries)
    .set({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      address: parsed.data.address || null,
      reason: parsed.data.reason,
    })
    .where(eq(blacklistEntries.id, parsed.data.id));

  revalidatePath("/beheerder/adoptie");
  revalidatePath("/beheerder/adoptie/zwarte-lijst");
  return { success: true, data: undefined, message: "Item bijgewerkt." };
}

export async function toggleBlacklistEntry(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("adoption:write");
  if (permCheck) return permCheck;

  let json: unknown;
  try {
    json = JSON.parse(formData.get("json") as string);
  } catch {
    return { success: false, error: "Ongeldige gegevens" };
  }

  const { id, isActive } = json as { id: number; isActive: boolean };

  if (!id || id <= 0) {
    return { success: false, error: "Ongeldig ID" };
  }

  if (typeof isActive !== "boolean") {
    return { success: false, error: "Ongeldige waarde voor status" };
  }

  await db
    .update(blacklistEntries)
    .set({ isActive })
    .where(eq(blacklistEntries.id, id));

  revalidatePath("/beheerder/adoptie");
  revalidatePath("/beheerder/adoptie/zwarte-lijst");
  return {
    success: true,
    data: undefined,
    message: isActive ? "Item geactiveerd." : "Item gedeactiveerd.",
  };
}
