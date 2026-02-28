"use server";

import { db } from "@/lib/db";
import { animals, operations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { operationSchema } from "@/lib/validations/operations";
import { getAnimalById } from "@/lib/queries/animals";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { ActionResult, Operation } from "@/types";

export async function createOperation(
  _prevState: ActionResult<Operation> | null,
  formData: FormData,
): Promise<ActionResult<Operation>> {
  const permCheck = await requirePermission("medical:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const raw = {
    animalId: formData.get("animalId"),
    type: (formData.get("type") as string) || "",
    date: (formData.get("date") as string) || "",
    notes: (formData.get("notes") as string)?.trim() || undefined,
  };

  const parsed = operationSchema.safeParse(raw);
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
      .insert(operations)
      .values({
        animalId: parsed.data.animalId,
        type: parsed.data.type,
        date: parsed.data.date,
        recordedBy: session?.userId ?? null,
        notes: parsed.data.notes || null,
      })
      .returning();

    // AC2: Auto-update is_neutered when steriliseren or castreren
    if (parsed.data.type === "steriliseren" || parsed.data.type === "castreren") {
      await db
        .update(animals)
        .set({ isNeutered: true })
        .where(eq(animals.id, parsed.data.animalId));
    }

    await logAudit("create_operation", "operation", record.id, null, record);
    revalidatePath("/beheerder/dieren");

    return { success: true, data: record as Operation };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het opslaan. Probeer het later opnieuw.",
    };
  }
}

export async function deleteOperation(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("medical:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) {
    return { success: false, error: "Ongeldig operatie-ID" };
  }

  try {
    const [existing] = await db
      .select()
      .from(operations)
      .where(eq(operations.id, id))
      .limit(1);
    if (!existing) return { success: false, error: "Operatie niet gevonden" };

    await db.delete(operations).where(eq(operations.id, id));

    await logAudit("delete_operation", "operation", existing.id, existing, null);
    revalidatePath("/beheerder/dieren");

    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het verwijderen. Probeer het later opnieuw.",
    };
  }
}
