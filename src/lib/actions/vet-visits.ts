"use server";

import { db } from "@/lib/db";
import { vetVisits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { vetVisitSchema } from "@/lib/validations/vet-visits";
import { getAnimalById } from "@/lib/queries/animals";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { ActionResult, VetVisit } from "@/types";

export async function createVetVisit(
  _prevState: ActionResult<VetVisit> | null,
  formData: FormData,
): Promise<ActionResult<VetVisit>> {
  const permCheck = await requirePermission("medical:first_check");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const raw = {
    animalId: formData.get("animalId"),
    date: (formData.get("date") as string) || "",
    location: (formData.get("location") as string) || "",
    diagnosis: (formData.get("diagnosis") as string)?.trim() || undefined,
    complaints: (formData.get("complaints") as string)?.trim() || undefined,
    todo: (formData.get("todo") as string)?.trim() || undefined,
    notes: (formData.get("notes") as string)?.trim() || undefined,
  };

  const parsed = vetVisitSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const animal = await getAnimalById(parsed.data.animalId);
  if (!animal) {
    return { success: false, error: "Dier niet gevonden" };
  }

  const session = await getSession();

  try {
    const [record] = await db
      .insert(vetVisits)
      .values({
        animalId: parsed.data.animalId,
        date: parsed.data.date,
        location: parsed.data.location,
        diagnosis: parsed.data.diagnosis || null,
        complaints: parsed.data.complaints || null,
        todo: parsed.data.todo || null,
        isCompleted: false,
        completedAt: null,
        recordedBy: session?.userId ?? null,
        notes: parsed.data.notes || null,
      })
      .returning();

    await logAudit("create_vet_visit", "vet_visit", record.id, null, record);
    revalidatePath("/beheerder/dieren");

    return { success: true, data: record as VetVisit };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het opslaan. Probeer het later opnieuw.",
    };
  }
}

export async function completeVetVisit(
  _prevState: ActionResult<VetVisit> | null,
  formData: FormData,
): Promise<ActionResult<VetVisit>> {
  const permCheck = await requirePermission("medical:first_check");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) {
    return { success: false, error: "Ongeldig bezoek-ID" };
  }

  const isCompleted = formData.get("isCompleted") === "true";

  try {
    const [existing] = await db
      .select()
      .from(vetVisits)
      .where(eq(vetVisits.id, id))
      .limit(1);
    if (!existing) return { success: false, error: "Bezoek niet gevonden" };

    const [updated] = await db
      .update(vetVisits)
      .set({
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      })
      .where(eq(vetVisits.id, id))
      .returning();

    await logAudit("complete_vet_visit", "vet_visit", id, existing, updated);
    revalidatePath("/beheerder/dieren");

    return { success: true, data: updated as VetVisit };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het bijwerken. Probeer het later opnieuw.",
    };
  }
}

export async function deleteVetVisit(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("medical:first_check");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) {
    return { success: false, error: "Ongeldig bezoek-ID" };
  }

  try {
    const [existing] = await db
      .select()
      .from(vetVisits)
      .where(eq(vetVisits.id, id))
      .limit(1);
    if (!existing) return { success: false, error: "Bezoek niet gevonden" };

    await db.delete(vetVisits).where(eq(vetVisits.id, id));

    await logAudit("delete_vet_visit", "vet_visit", existing.id, existing, null);
    revalidatePath("/beheerder/dieren");

    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het verwijderen. Probeer het later opnieuw.",
    };
  }
}
