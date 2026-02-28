"use server";

import { db } from "@/lib/db";
import { kennismakingen, adoptionCandidates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth/session";
import { kennismakingSchema, kennismakingOutcomeSchema } from "@/lib/validations/kennismakingen";
import { revalidatePath } from "next/cache";
import type { ActionResult, Kennismaking } from "@/types";

export async function createKennismaking(
  _prevState: ActionResult<Kennismaking> | null,
  formData: FormData,
): Promise<ActionResult<Kennismaking>> {
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

  const parsed = kennismakingSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Check candidate exists and is goede_kandidaat
  try {
    const [candidate] = await db
      .select()
      .from(adoptionCandidates)
      .where(eq(adoptionCandidates.id, parsed.data.adoptionCandidateId))
      .limit(1);
    if (!candidate) return { success: false, error: "Kandidaat niet gevonden" };
    if (candidate.category !== "goede_kandidaat") {
      return { success: false, error: "Alleen een goede kandidaat kan een kennismaking krijgen" };
    }
  } catch {
    return { success: false, error: "Fout bij ophalen kandidaat" };
  }

  const session = await getSession();

  try {
    const [record] = await db
      .insert(kennismakingen)
      .values({
        adoptionCandidateId: parsed.data.adoptionCandidateId,
        animalId: parsed.data.animalId,
        scheduledAt: new Date(parsed.data.scheduledAt),
        location: parsed.data.location || null,
        status: "scheduled",
        createdBy: session?.name || "Onbekend",
      })
      .returning();

    await logAudit("create_kennismaking", "kennismaking", record.id, null, record);
    revalidatePath("/beheerder/adoptie");

    return { success: true, data: record as Kennismaking };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het opslaan. Probeer het later opnieuw.",
    };
  }
}

export async function registerKennismakingOutcome(
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

  const { id, ...rest } = raw as { id: number; outcome: string; notes?: string };
  const parsed = kennismakingOutcomeSchema.safeParse(rest);
  if (!parsed.success) {
    return { success: false, error: "Ongeldige uitkomst" };
  }

  try {
    const [existing] = await db
      .select()
      .from(kennismakingen)
      .where(eq(kennismakingen.id, id))
      .limit(1);
    if (!existing) return { success: false, error: "Kennismaking niet gevonden" };

    // Update kennismaking
    await db
      .update(kennismakingen)
      .set({
        status: "completed",
        outcome: parsed.data.outcome,
        notes: parsed.data.notes || null,
      })
      .where(eq(kennismakingen.id, id));

    // Update candidate status based on outcome
    const newCandidateStatus = parsed.data.outcome === "positief" ? "approved" : "screening";
    await db
      .update(adoptionCandidates)
      .set({ status: newCandidateStatus })
      .where(eq(adoptionCandidates.id, existing.adoptionCandidateId));

    await logAudit(
      "register_kennismaking_outcome",
      "kennismaking",
      id,
      { status: existing.status, outcome: existing.outcome },
      { status: "completed", outcome: parsed.data.outcome },
    );
    revalidatePath("/beheerder/adoptie");

    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het opslaan. Probeer het later opnieuw.",
    };
  }
}
