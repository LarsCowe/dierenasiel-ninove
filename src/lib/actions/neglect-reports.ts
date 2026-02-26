"use server";

import { db } from "@/lib/db";
import { neglectReports } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { neglectReportSchema } from "@/lib/validations/neglect-reports";
import { revalidatePath } from "next/cache";
import type { ActionResult, NeglectReport } from "@/types";

export async function createNeglectReport(
  _prevState: ActionResult<NeglectReport> | null,
  formData: FormData,
): Promise<ActionResult<NeglectReport>> {
  const permCheck = await requirePermission("medical:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const photosRaw = formData.get("photos") as string | null;
  let photos: string[] | undefined;
  if (photosRaw) {
    try {
      photos = JSON.parse(photosRaw);
    } catch {
      photos = undefined;
    }
  }

  const raw = {
    animalId: formData.get("animalId"),
    date: (formData.get("date") as string) || undefined,
    vetName: (formData.get("vetName") as string) || undefined,
    healthStatusOnArrival: (formData.get("healthStatusOnArrival") as string) || "",
    neglectFindings: (formData.get("neglectFindings") as string) || "",
    treatmentsGiven: (formData.get("treatmentsGiven") as string) || undefined,
    weightOnArrival: (formData.get("weightOnArrival") as string) || undefined,
    photos,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = neglectReportSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const [report] = await db
      .insert(neglectReports)
      .values({
        animalId: parsed.data.animalId,
        date: parsed.data.date || null,
        vetName: parsed.data.vetName || null,
        healthStatusOnArrival: parsed.data.healthStatusOnArrival,
        neglectFindings: parsed.data.neglectFindings,
        treatmentsGiven: parsed.data.treatmentsGiven || null,
        weightOnArrival: parsed.data.weightOnArrival || null,
        photos: parsed.data.photos?.length ? parsed.data.photos : null,
        notes: parsed.data.notes || null,
      })
      .returning();

    await logAudit("create_neglect_report", "neglect_report", report.id, null, report);
    revalidatePath("/beheerder/dieren");

    return { success: true, data: report };
  } catch (err: unknown) {
    const pgError = err as { code?: string };
    if (pgError.code === "23505") {
      return {
        success: false,
        error: "Er bestaat al een verwaarlozing-rapport voor dit dier.",
      };
    }
    return {
      success: false,
      error: "Er ging iets mis bij het opslaan. Probeer het later opnieuw.",
    };
  }
}

export async function updateNeglectReport(
  _prevState: ActionResult<NeglectReport> | null,
  formData: FormData,
): Promise<ActionResult<NeglectReport>> {
  const permCheck = await requirePermission("medical:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const id = Number(formData.get("id"));
  if (!id || isNaN(id)) {
    return { success: false, error: "Ongeldig rapport-ID" };
  }

  const photosRaw = formData.get("photos") as string | null;
  let photos: string[] | undefined;
  if (photosRaw) {
    try {
      photos = JSON.parse(photosRaw);
    } catch {
      photos = undefined;
    }
  }

  const raw = {
    animalId: formData.get("animalId"),
    date: (formData.get("date") as string) || undefined,
    vetName: (formData.get("vetName") as string) || undefined,
    healthStatusOnArrival: (formData.get("healthStatusOnArrival") as string) || "",
    neglectFindings: (formData.get("neglectFindings") as string) || "",
    treatmentsGiven: (formData.get("treatmentsGiven") as string) || undefined,
    weightOnArrival: (formData.get("weightOnArrival") as string) || undefined,
    photos,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = neglectReportSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const [oldReport] = await db
      .select()
      .from(neglectReports)
      .where(eq(neglectReports.id, id))
      .limit(1);
    if (!oldReport) return { success: false, error: "Rapport niet gevonden" };

    const [updated] = await db
      .update(neglectReports)
      .set({
        date: parsed.data.date || null,
        vetName: parsed.data.vetName || null,
        healthStatusOnArrival: parsed.data.healthStatusOnArrival,
        neglectFindings: parsed.data.neglectFindings,
        treatmentsGiven: parsed.data.treatmentsGiven || null,
        weightOnArrival: parsed.data.weightOnArrival || null,
        photos: parsed.data.photos?.length ? parsed.data.photos : null,
        notes: parsed.data.notes || null,
      })
      .where(eq(neglectReports.id, id))
      .returning();

    await logAudit("update_neglect_report", "neglect_report", updated.id, oldReport, updated);
    revalidatePath("/beheerder/dieren");

    return { success: true, data: updated };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het opslaan. Probeer het later opnieuw.",
    };
  }
}
