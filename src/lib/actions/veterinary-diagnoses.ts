"use server";

import { db } from "@/lib/db";
import { veterinaryDiagnoses } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { addDiagnosisSchema } from "@/lib/validations/veterinary-diagnoses";
import type { ActionResult } from "@/types";

/**
 * Story 10.10: voeg een nieuwe diagnose toe aan de master-lijst.
 * Idempotent case-insensitive: als dezelfde naam (ongeacht hoofdletters)
 * al bestaat, wordt die bestaande entry teruggegeven en wordt niets
 * ingevoegd. Voorkomt duplicaten van 'Oorontsteking' vs 'oorontsteking'.
 */
export async function addDiagnosisAction(
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: number; name: string }>> {
  const perm = await requirePermission("medical:write");
  if (perm && !perm.success) return { success: false, error: perm.error };

  const parsed = addDiagnosisSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Ongeldige invoer", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const normalized = parsed.data.name.trim();

  try {
    // Case-insensitive duplicate-check
    const existing = await db
      .select({ id: veterinaryDiagnoses.id, name: veterinaryDiagnoses.name })
      .from(veterinaryDiagnoses)
      .where(sql`LOWER(${veterinaryDiagnoses.name}) = LOWER(${normalized})`)
      .limit(1);

    if (existing.length > 0) {
      return { success: true, data: existing[0] };
    }

    const [record] = await db
      .insert(veterinaryDiagnoses)
      .values({ name: normalized })
      .returning({ id: veterinaryDiagnoses.id, name: veterinaryDiagnoses.name });

    await logAudit(
      "veterinary_diagnosis.added",
      "veterinary_diagnosis",
      record.id,
      null,
      { name: record.name },
    );

    revalidatePath("/beheerder/medisch");
    return { success: true, data: record };
  } catch (error) {
    console.error("addDiagnosisAction failed:", error);
    return { success: false, error: "Diagnose toevoegen mislukt. Probeer opnieuw." };
  }
}
