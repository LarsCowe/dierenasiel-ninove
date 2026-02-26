"use server";

import { db } from "@/lib/db";
import { medicationLogs, medications } from "@/lib/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { medicationLogSchema } from "@/lib/validations/medication-logs";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { getBelgianDayBounds } from "@/lib/utils/date";
import type { ActionResult, MedicationLog } from "@/types";

export async function createMedicationLog(
  _prevState: ActionResult<MedicationLog> | null,
  formData: FormData,
): Promise<ActionResult<MedicationLog>> {
  const permCheck = await requirePermission("medical:first_check");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const raw = {
    medicationId: formData.get("medicationId"),
    notes: (formData.get("notes") as string)?.trim() || undefined,
  };

  const parsed = medicationLogSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Verify medication exists and is active
  const [existing] = await db
    .select()
    .from(medications)
    .where(eq(medications.id, parsed.data.medicationId))
    .limit(1);

  if (!existing) {
    return { success: false, error: "Medicatie niet gevonden" };
  }
  if (!existing.isActive) {
    return { success: false, error: "Medicatie is niet meer actief" };
  }

  // Idempotency: check if already checked off today (Belgian time)
  const { start, end } = getBelgianDayBounds();

  const [alreadyLogged] = await db
    .select()
    .from(medicationLogs)
    .where(
      and(
        eq(medicationLogs.medicationId, parsed.data.medicationId),
        gte(medicationLogs.administeredAt, start),
        lt(medicationLogs.administeredAt, end),
      ),
    )
    .limit(1);

  if (alreadyLogged) {
    return { success: false, error: "Deze medicatie is vandaag al afgevinkt" };
  }

  const session = await getSession();

  try {
    const [record] = await db
      .insert(medicationLogs)
      .values({
        medicationId: parsed.data.medicationId,
        administeredAt: new Date(),
        administeredBy: session?.name ?? null,
        administeredByUserId: session?.userId ?? null,
        notes: parsed.data.notes || null,
      })
      .returning();

    await logAudit("create_medication_log", "medication_log", record.id, null, record);
    revalidatePath("/beheerder/medisch");
    revalidatePath("/beheerder/dieren");
    revalidatePath("/beheerder/dieren/[id]", "page");

    return { success: true, data: record as MedicationLog };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het afvinken. Probeer het later opnieuw.",
    };
  }
}

export async function deleteMedicationLog(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("medical:first_check");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) {
    return { success: false, error: "Ongeldig log-ID" };
  }

  try {
    const [existing] = await db
      .select()
      .from(medicationLogs)
      .where(eq(medicationLogs.id, id))
      .limit(1);
    if (!existing) return { success: false, error: "Log niet gevonden" };

    await db.delete(medicationLogs).where(eq(medicationLogs.id, id));

    await logAudit("delete_medication_log", "medication_log", existing.id, existing, null);
    revalidatePath("/beheerder/medisch");
    revalidatePath("/beheerder/dieren");
    revalidatePath("/beheerder/dieren/[id]", "page");

    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het ongedaan maken. Probeer het later opnieuw.",
    };
  }
}
