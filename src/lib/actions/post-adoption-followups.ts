"use server";

import { db } from "@/lib/db";
import { postAdoptionFollowups, adoptionContracts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { updateFollowupSchema, createCustomFollowupSchema } from "@/lib/validations/post-adoption-followups";
import { revalidatePath } from "next/cache";
import type { ActionResult, PostAdoptionFollowup } from "@/types";

export async function updateFollowupStatus(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("adoption:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(formData.get("json") as string);
  } catch {
    return { success: false, error: "Ongeldige gegevens" };
  }

  const parsed = updateFollowupSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    // Find existing followup
    const [followup] = await db
      .select()
      .from(postAdoptionFollowups)
      .where(eq(postAdoptionFollowups.id, parsed.data.id))
      .limit(1);

    if (!followup) return { success: false, error: "Opvolging niet gevonden" };
    if (followup.status !== "planned") {
      return { success: false, error: "Deze opvolging is reeds afgehandeld" };
    }

    // Update status
    const [updated] = await db
      .update(postAdoptionFollowups)
      .set({
        status: parsed.data.status,
        notes: parsed.data.notes ?? null,
      })
      .where(eq(postAdoptionFollowups.id, parsed.data.id))
      .returning();

    await logAudit(
      "update_followup_status",
      "post_adoption_followup",
      followup.id,
      { status: followup.status, notes: followup.notes },
      { status: updated.status, notes: updated.notes },
    );

    revalidatePath("/beheerder/adoptie");
    revalidatePath("/beheerder/adoptie/opvolging");
    revalidatePath("/beheerder/adoptie/[id]", "page");

    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het bijwerken. Probeer het later opnieuw.",
    };
  }
}

export async function createCustomFollowup(
  _prevState: ActionResult<PostAdoptionFollowup> | null,
  formData: FormData,
): Promise<ActionResult<PostAdoptionFollowup>> {
  const permCheck = await requirePermission("adoption:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(formData.get("json") as string);
  } catch {
    return { success: false, error: "Ongeldige gegevens" };
  }

  const parsed = createCustomFollowupSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    // Check contract exists
    const [contract] = await db
      .select()
      .from(adoptionContracts)
      .where(eq(adoptionContracts.id, parsed.data.contractId))
      .limit(1);

    if (!contract) return { success: false, error: "Contract niet gevonden" };

    // Insert custom followup
    const [record] = await db
      .insert(postAdoptionFollowups)
      .values({
        contractId: parsed.data.contractId,
        followupType: "custom",
        date: parsed.data.date,
        notes: parsed.data.notes ?? null,
        status: "planned",
      })
      .returning();

    await logAudit(
      "create_custom_followup",
      "post_adoption_followup",
      record.id,
      null,
      record,
    );

    revalidatePath("/beheerder/adoptie");
    revalidatePath("/beheerder/adoptie/opvolging");
    revalidatePath("/beheerder/adoptie/[id]", "page");

    return { success: true, data: record as PostAdoptionFollowup };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het opslaan. Probeer het later opnieuw.",
    };
  }
}
