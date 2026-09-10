"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { staffAttendance, staffSlots } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { isUniqueViolation } from "@/lib/db/errors";
import { findOverlap, formatTimeRange, samePerson, timeRangeIssues } from "@/lib/staff/attendance";
import { TASK_MAX_LENGTH, normalizeTask } from "@/lib/staff/tasks";
import { SLOT_MAX_CAPACITY, type Slot } from "@/lib/staff/slots";
import { getSlotById, getSlotRowsOnDay, getSlotTakers } from "@/lib/queries/staff-slots";
import { findApprovedWalker } from "@/lib/queries/staff-attendance";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

/**
 * Epic 14, story 14.3 — plaatsjes per tijdsblok. Zie de ontwerpnota in
 * `_bmad-output/implementation-artifacts/14-3-plaatsjes-per-tijdsblok.md`.
 *
 * | Handeling                                 | Wie                     |
 * |-------------------------------------------|-------------------------|
 * | plaatsje aanmaken / verwijderen           | leiding (`staff:write`) |
 * | zelf een plaatsje nemen                   | `staff:read`            |
 * | een wandelaar of naam op een plaatsje     | leiding (`staff:write`) |
 */

const PATH = "/beheerder/personeel";
const KIES_WANDELAAR = "Kies een wandelaar uit de lijst";
const AANTAL = `Kies tussen 1 en ${SLOT_MAX_CAPACITY} plaatsen`;

const optionalTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ongeldig uur (UU:MM)")
  .optional()
  .or(z.literal(""));

const createSlotSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldige datum"),
    startTime: optionalTime,
    endTime: optionalTime,
    task: z
      .string()
      .optional()
      .transform((v) => normalizeTask(v))
      .refine((v) => v !== null, "Vul een taak in")
      .refine((v) => v === null || v.length <= TASK_MAX_LENGTH, `Taak mag max ${TASK_MAX_LENGTH} tekens zijn`),
    capacity: z
      .string()
      .regex(/^\d{1,2}$/, AANTAL)
      .transform(Number)
      .refine((n) => n >= 1 && n <= SLOT_MAX_CAPACITY, AANTAL),
    note: z.string().trim().max(200, "Toelichting mag max 200 tekens zijn").optional().default(""),
  })
  .superRefine((data, ctx) => {
    for (const issue of timeRangeIssues(data.startTime, data.endTime)) {
      ctx.addIssue({ code: "custom", path: [issue.path], message: issue.message });
    }
  });

/** Een plaatsje klaarzetten — enkel de leiding. */
export async function createSlot(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };
  if (!hasPermission(session.role, "staff:write")) {
    return { success: false, error: "Enkel de leiding kan plaatsjes klaarzetten" };
  }

  const values = {
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    task: String(formData.get("task") ?? ""),
    capacity: String(formData.get("capacity") ?? ""),
    note: String(formData.get("note") ?? ""),
  };

  const parsed = createSlotSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validatie mislukt",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      values,
    };
  }

  const nieuw = {
    date: parsed.data.date,
    startTime: parsed.data.startTime || null,
    endTime: parsed.data.endTime || null,
    task: parsed.data.task as string,
    capacity: parsed.data.capacity,
    note: parsed.data.note || null,
  };

  const [rij] = await db
    .insert(staffSlots)
    .values({ ...nieuw, createdBy: session.userId })
    .returning({ id: staffSlots.id });

  await logAudit("staff_slot.created", "staff_slot", rij.id, null, nieuw);

  revalidatePath(PATH);
  return { success: true, data: undefined, message: "Plaatsje klaargezet." };
}

/**
 * Een plaatsje weghalen — enkel de leiding, en enkel als er niemand op staat. Anders zou
 * iemand stilletjes zijn taak kwijtraken; eerst die mensen weghalen (✕).
 */
export async function deleteSlot(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };
  if (!hasPermission(session.role, "staff:write")) {
    return { success: false, error: "Enkel de leiding kan plaatsjes weghalen" };
  }

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { success: false, error: "Ongeldig plaatsje" };

  const slot = await getSlotById(id);
  if (!slot) return { success: false, error: "Plaatsje niet gevonden" };

  const takers = await getSlotTakers(id);
  if (takers.length > 0) {
    const n = takers.length;
    return {
      success: false,
      error: `Er ${n === 1 ? "staat al 1 persoon" : `staan al ${n} mensen`} op dit plaatsje. Haal ${n === 1 ? "die" : "hen"} eerst weg (✕).`,
    };
  }

  await db.delete(staffSlots).where(eq(staffSlots.id, id));
  await logAudit("staff_slot.deleted", "staff_slot", id, slot, null);

  revalidatePath(PATH);
  return { success: true, data: undefined, message: "Plaatsje weggehaald." };
}

type Persoon = { userId: number | null; guestName: string | null };

/**
 * De gemeenschappelijke stap van zelf nemen en toewijzen. Een plaatsje nemen = een
 * inschrijving met `slotId`, met de uren en de taak van het plaatsje.
 */
async function neemPlaatsje(
  slot: Slot,
  persoon: Persoon,
  wie: string,
  createdBy: number,
  zelf: boolean,
): Promise<ActionResult> {
  const takers = await getSlotTakers(slot.id);
  if (takers.some((t) => samePerson(t, persoon))) {
    revalidatePath(PATH);
    return {
      success: true,
      data: undefined,
      message: zelf ? "Je had dit plaatsje al." : `${wie} stond al op dit plaatsje.`,
    };
  }
  if (takers.length >= slot.capacity) {
    return { success: false, error: "Dit plaatsje is al volzet." };
  }

  // Twee plaatsjes tegelijk kan niet; een gewoon blok ("hele dag") telt hier niet mee.
  const blok = { ...persoon, startTime: slot.startTime, endTime: slot.endTime };
  const botsing = findOverlap(await getSlotRowsOnDay(slot.date), blok);
  if (botsing) {
    return {
      success: false,
      error: `${zelf ? "Je hebt" : `${wie} heeft`} die dag al een plaatsje (${formatTimeRange(botsing)}). Twee dingen tegelijk gaat niet.`,
    };
  }

  let mijnId: number;
  try {
    const [rij] = await db
      .insert(staffAttendance)
      .values({
        date: slot.date,
        userId: persoon.userId,
        guestName: persoon.guestName,
        startTime: slot.startTime,
        endTime: slot.endTime,
        task: slot.task,
        slotId: slot.id,
        createdBy,
      })
      .returning({ id: staffAttendance.id });
    mijnId = rij.id;
  } catch (err) {
    // De uniciteitsregel van 14.7 kijkt naar (dag, persoon, beginuur): een gewoon blok dat
    // op hetzelfde uur begint als het plaatsje, botst daar.
    if (isUniqueViolation(err)) {
      return {
        success: false,
        error: `${zelf ? "Je staat" : `${wie} staat`} die dag al ingeschreven vanaf ${slot.startTime ?? "het begin van de dag"}. Haal die inschrijving eerst weg om dit plaatsje te nemen.`,
      };
    }
    return { success: false, error: "Er ging iets mis bij het nemen van het plaatsje." };
  }

  // Natellen: zonder transactie kunnen twee mensen tegelijk de laatste plaats nemen.
  // Wie buiten het aantal valt (in volgorde van aanmaak), was net te laat.
  const na = await getSlotTakers(slot.id);
  if (na.findIndex((t) => t.id === mijnId) >= slot.capacity) {
    await db.delete(staffAttendance).where(eq(staffAttendance.id, mijnId));
    return { success: false, error: "Net volzet: iemand was je voor." };
  }

  await logAudit("staff_slot.taken", "staff_attendance", mijnId, null, {
    slotId: slot.id,
    userId: persoon.userId,
    guestName: persoon.guestName,
  });

  revalidatePath(PATH);
  return { success: true, data: undefined, message: zelf ? "Plaatsje genomen." : `${wie} staat op het plaatsje.` };
}

function leesSlotId(formData: FormData): number | null {
  const id = Number(formData.get("slotId"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Zelf een plaatsje nemen — wie de planning ziet. */
export async function takeSlot(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };
  if (!hasPermission(session.role, "staff:read")) return { success: false, error: "Onvoldoende rechten" };

  const slotId = leesSlotId(formData);
  if (!slotId) return { success: false, error: "Ongeldig plaatsje" };

  const slot = await getSlotById(slotId);
  if (!slot) return { success: false, error: "Plaatsje niet gevonden" };

  return neemPlaatsje(slot, { userId: session.userId, guestName: null }, "Je", session.userId, true);
}

/**
 * Een wandelaar of iemand zonder account op een plaatsje zetten — enkel de leiding.
 * Vrijwilligers schrijven zichzelf niet in (Sven, vraag 3).
 */
export async function assignToSlot(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };
  if (!hasPermission(session.role, "staff:write")) {
    return { success: false, error: "Enkel de leiding kan iemand op een plaatsje zetten" };
  }

  const values = {
    slotId: String(formData.get("slotId") ?? ""),
    walkerUserId: String(formData.get("walkerUserId") ?? ""),
    guestName: String(formData.get("guestName") ?? "").trim(),
  };

  let persoon: Persoon;
  let wie: string;
  if (values.walkerUserId) {
    // Zelfde grens als bij 14.4: een nummer buiten een Postgres-integer is geen wandelaar.
    const walkerId = /^[1-9]\d{0,8}$/.test(values.walkerUserId) ? Number(values.walkerUserId) : null;
    const wandelaar = walkerId
      ? await findApprovedWalker(walkerId).catch((err) => {
          console.error("findApprovedWalker failed:", err);
          return null;
        })
      : null;
    if (!wandelaar) {
      return { success: false, error: "Validatie mislukt", fieldErrors: { walkerUserId: [KIES_WANDELAAR] }, values };
    }
    persoon = { userId: wandelaar.userId, guestName: null };
    wie = wandelaar.name;
  } else if (values.guestName) {
    if (values.guestName.length > 200) {
      return { success: false, error: "Validatie mislukt", fieldErrors: { guestName: ["Naam mag max 200 tekens zijn"] }, values };
    }
    persoon = { userId: null, guestName: values.guestName };
    wie = values.guestName;
  } else {
    return {
      success: false,
      error: "Validatie mislukt",
      fieldErrors: { guestName: ["Vul een naam in of kies een wandelaar"] },
      values,
    };
  }

  const slotId = leesSlotId(formData);
  if (!slotId) return { success: false, error: "Ongeldig plaatsje" };
  const slot = await getSlotById(slotId);
  if (!slot) return { success: false, error: "Plaatsje niet gevonden" };

  const result = await neemPlaatsje(slot, persoon, wie, session.userId, false);
  return result.success ? result : { ...result, values };
}
