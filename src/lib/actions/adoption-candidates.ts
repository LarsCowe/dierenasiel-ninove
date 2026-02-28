"use server";

import { db } from "@/lib/db";
import { adoptionCandidates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { adoptionCandidateSchema } from "@/lib/validations/adoption-candidates";
import { getAnimalById } from "@/lib/queries/animals";
import { revalidatePath } from "next/cache";
import type { ActionResult, AdoptionCandidate } from "@/types";

export async function createAdoptionCandidate(
  _prevState: ActionResult<AdoptionCandidate> | null,
  formData: FormData,
): Promise<ActionResult<AdoptionCandidate>> {
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

  const parsed = adoptionCandidateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const animal = await getAnimalById(parsed.data.animalId);
  if (!animal) {
    return { success: false, error: "Dier niet gevonden" };
  }
  if (!animal.isAvailableForAdoption) {
    return { success: false, error: "Dit dier is niet beschikbaar voor adoptie" };
  }

  try {
    const [record] = await db
      .insert(adoptionCandidates)
      .values({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        animalId: parsed.data.animalId,
        questionnaireAnswers: parsed.data.questionnaireAnswers,
        status: "pending",
        notes: parsed.data.notes || null,
      })
      .returning();

    await logAudit("create_adoption_candidate", "adoption_candidate", record.id, null, record);
    revalidatePath("/beheerder/adoptie");

    return { success: true, data: record as AdoptionCandidate };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het opslaan. Probeer het later opnieuw.",
    };
  }
}

export async function deleteAdoptionCandidate(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("adoption:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) {
    return { success: false, error: "Ongeldig kandidaat-ID" };
  }

  try {
    const [existing] = await db
      .select()
      .from(adoptionCandidates)
      .where(eq(adoptionCandidates.id, id))
      .limit(1);
    if (!existing) return { success: false, error: "Kandidaat niet gevonden" };

    if (existing.status !== "pending" && existing.status !== "screening") {
      return { success: false, error: "Een kandidaat met deze status kan niet verwijderd worden" };
    }

    await db.delete(adoptionCandidates).where(eq(adoptionCandidates.id, id));

    await logAudit("delete_adoption_candidate", "adoption_candidate", existing.id, existing, null);
    revalidatePath("/beheerder/adoptie");

    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het verwijderen. Probeer het later opnieuw.",
    };
  }
}
