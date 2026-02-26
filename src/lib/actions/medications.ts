"use server";

import { db } from "@/lib/db";
import { medications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { medicationSchema } from "@/lib/validations/medications";
import { getAnimalById } from "@/lib/queries/animals";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { ActionResult, Medication } from "@/types";

export async function createMedication(
  _prevState: ActionResult<Medication> | null,
  formData: FormData,
): Promise<ActionResult<Medication>> {
  const permCheck = await requirePermission("medical:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const raw = {
    animalId: formData.get("animalId"),
    medicationName: (formData.get("medicationName") as string) || "",
    dosage: (formData.get("dosage") as string) || "",
    quantity: (formData.get("quantity") as string)?.trim() || undefined,
    startDate: (formData.get("startDate") as string) || "",
    endDate: (formData.get("endDate") as string) || "",
    notes: (formData.get("notes") as string)?.trim() || undefined,
  };

  const parsed = medicationSchema.safeParse(raw);
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
      .insert(medications)
      .values({
        animalId: parsed.data.animalId,
        medicationName: parsed.data.medicationName,
        dosage: parsed.data.dosage,
        quantity: parsed.data.quantity || null,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate || null,
        isActive: true,
        recordedBy: session?.userId ?? null,
        notes: parsed.data.notes || null,
      })
      .returning();

    await logAudit("create_medication", "medication", record.id, null, record);
    revalidatePath("/beheerder/dieren");

    return { success: true, data: record as Medication };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het opslaan. Probeer het later opnieuw.",
    };
  }
}

export async function stopMedication(
  _prevState: ActionResult<Medication> | null,
  formData: FormData,
): Promise<ActionResult<Medication>> {
  const permCheck = await requirePermission("medical:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) {
    return { success: false, error: "Ongeldig medicatie-ID" };
  }

  try {
    const [existing] = await db
      .select()
      .from(medications)
      .where(eq(medications.id, id))
      .limit(1);
    if (!existing) return { success: false, error: "Medicatie niet gevonden" };

    const [updated] = await db
      .update(medications)
      .set({
        isActive: false,
        endDate: new Date().toISOString().split("T")[0],
      })
      .where(eq(medications.id, id))
      .returning();

    await logAudit("stop_medication", "medication", id, existing, updated);
    revalidatePath("/beheerder/dieren");

    return { success: true, data: updated as Medication };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het stoppen. Probeer het later opnieuw.",
    };
  }
}

export async function deleteMedication(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("medical:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) {
    return { success: false, error: "Ongeldig medicatie-ID" };
  }

  try {
    const [existing] = await db
      .select()
      .from(medications)
      .where(eq(medications.id, id))
      .limit(1);
    if (!existing) return { success: false, error: "Medicatie niet gevonden" };

    await db.delete(medications).where(eq(medications.id, id));

    await logAudit("delete_medication", "medication", existing.id, existing, null);
    revalidatePath("/beheerder/dieren");

    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het verwijderen. Probeer het later opnieuw.",
    };
  }
}
