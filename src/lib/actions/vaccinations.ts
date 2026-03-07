"use server";

import { db } from "@/lib/db";
import { vaccinations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { vaccinationSchema } from "@/lib/validations/vaccinations";
import { getAnimalById } from "@/lib/queries/animals";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { ActionResult, Vaccination } from "@/types";

export async function createVaccination(
  _prevState: ActionResult<Vaccination> | null,
  formData: FormData,
): Promise<ActionResult<Vaccination>> {
  const permCheck = await requirePermission("medical:first_check");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const raw = {
    animalId: formData.get("animalId"),
    type: (formData.get("type") as string) || "",
    date: (formData.get("date") as string) || "",
    nextDueDate: (formData.get("nextDueDate") as string) || undefined,
    givenByShelter: formData.get("givenByShelter") === "true",
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = vaccinationSchema.safeParse(raw);
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
      .insert(vaccinations)
      .values({
        animalId: parsed.data.animalId,
        type: parsed.data.type,
        date: parsed.data.date,
        nextDueDate: parsed.data.nextDueDate || null,
        givenByShelter: parsed.data.givenByShelter,
        administeredBy: session?.userId ?? null,
        notes: parsed.data.notes || null,
      })
      .returning();

    await logAudit("create_vaccination", "vaccination", record.id, null, record);
    revalidatePath("/beheerder/dieren");

    return { success: true, data: record as Vaccination };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het opslaan. Probeer het later opnieuw.",
    };
  }
}

export async function deleteVaccination(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("medical:first_check");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) {
    return { success: false, error: "Ongeldig vaccinatie-ID" };
  }

  try {
    const [existing] = await db
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.id, id))
      .limit(1);
    if (!existing) return { success: false, error: "Vaccinatie niet gevonden" };

    await db.delete(vaccinations).where(eq(vaccinations.id, id));

    await logAudit("delete_vaccination", "vaccination", existing.id, existing, null);
    revalidatePath("/beheerder/dieren");

    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het verwijderen. Probeer het later opnieuw.",
    };
  }
}
