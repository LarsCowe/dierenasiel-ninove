"use server";

import { db } from "@/lib/db";
import { eventShifts } from "@/lib/db/schema";
import { eq, type InferSelectModel } from "drizzle-orm";
import { requireEventDraaiboekAccess } from "@/lib/events/event-access";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { eventShiftSchema } from "@/lib/validations/event-shifts";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export type EventShiftRow = InferSelectModel<typeof eventShifts>;

const fichePad = (eventId: number) => `/beheerder/evenementen/${eventId}`;

function readForm(formData: FormData) {
  return {
    eventId: (formData.get("eventId") as string) || "",
    date: (formData.get("date") as string) || "",
    startTime: (formData.get("startTime") as string) || "",
    endTime: (formData.get("endTime") as string) || "",
    post: (formData.get("post") as string)?.trim() || "",
    personName: (formData.get("personName") as string)?.trim() || "",
    notes: (formData.get("notes") as string)?.trim() || "",
  };
}

function toColumns(d: ReturnType<typeof eventShiftSchema.parse>) {
  return {
    eventId: d.eventId,
    date: d.date,
    startTime: d.startTime || null,
    endTime: d.endTime || null,
    post: d.post,
    personName: d.personName,
    notes: d.notes || null,
  };
}

function foutAntwoord(
  waarden: ReturnType<typeof readForm>,
  parsed: ReturnType<typeof eventShiftSchema.safeParse>,
): ActionResult<EventShiftRow> {
  return {
    success: false,
    fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    values: Object.fromEntries(Object.entries(waarden).map(([k, v]) => [k, String(v)])),
  };
}

export async function createEventShift(
  _prev: ActionResult<EventShiftRow> | null,
  formData: FormData,
): Promise<ActionResult<EventShiftRow>> {
  // Story 13.14 — de beheerder, of de trekker van het evenement waar de shift bij komt.
  const toegang = await requireEventDraaiboekAccess(Number(formData.get("eventId")));
  if (toegang) return toegang;

  const waarden = readForm(formData);
  const parsed = eventShiftSchema.safeParse(waarden);
  if (!parsed.success) return foutAntwoord(waarden, parsed);

  try {
    const session = await getSession();
    const sortOrder = Math.floor(Date.now() / 1000);
    const [record] = await db
      .insert(eventShifts)
      .values({ ...toColumns(parsed.data), sortOrder, createdByUserId: session?.userId ?? null })
      .returning();

    await logAudit("create_event_shift", "event_shift", record.id, null, record);
    revalidatePath(fichePad(parsed.data.eventId));
    return { success: true, data: record };
  } catch {
    return { success: false, error: "Er ging iets mis bij het opslaan van de shift." };
  }
}

export async function updateEventShift(
  _prev: ActionResult<EventShiftRow> | null,
  formData: FormData,
): Promise<ActionResult<EventShiftRow>> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { success: false, error: "Ongeldige shift" };

  try {
    const [old] = await db.select().from(eventShifts).where(eq(eventShifts.id, id)).limit(1);
    if (!old) return { success: false, error: "Shift niet gevonden" };

    // Het evenement van de bestaande shift telt, niet wat het formulier meestuurt.
    const toegang = await requireEventDraaiboekAccess(old.eventId);
    if (toegang) return toegang;

    const waarden = readForm(formData);
    const parsed = eventShiftSchema.safeParse(waarden);
    if (!parsed.success) return foutAntwoord(waarden, parsed);

    const [record] = await db
      .update(eventShifts)
      // Een shift verhuist niet naar een ander evenement.
      .set({ ...toColumns(parsed.data), eventId: old.eventId, updatedAt: new Date() })
      .where(eq(eventShifts.id, id))
      .returning();

    await logAudit("update_event_shift", "event_shift", id, old, record);
    revalidatePath(fichePad(old.eventId));
    return { success: true, data: record };
  } catch {
    return { success: false, error: "Er ging iets mis bij het opslaan van de shift." };
  }
}

export async function deleteEventShift(id: number): Promise<ActionResult<{ id: number }>> {
  if (!Number.isInteger(id) || id <= 0) return { success: false, error: "Ongeldige shift" };

  try {
    const [old] = await db.select().from(eventShifts).where(eq(eventShifts.id, id)).limit(1);
    if (!old) return { success: false, error: "Shift niet gevonden" };

    const toegang = await requireEventDraaiboekAccess(old.eventId);
    if (toegang) return toegang;

    await db.delete(eventShifts).where(eq(eventShifts.id, id));
    await logAudit("delete_event_shift", "event_shift", id, old, null);
    revalidatePath(fichePad(old.eventId));
    return { success: true, data: { id } };
  } catch {
    return { success: false, error: "Er ging iets mis bij het verwijderen van de shift." };
  }
}
