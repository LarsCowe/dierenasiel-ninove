"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { staffAttendance } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { findOverlap, formatTimeRange, isSameBlock, samePerson } from "@/lib/staff/attendance";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

const PATH = "/beheerder/personeel";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldige datum");

// Story 14.7 — zelfde notatie als `events` en `event_shifts`.
const optionalTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ongeldig uur (UU:MM)")
  .optional()
  .or(z.literal(""));

const note = z.string().trim().max(200, "Toelichting mag max 200 tekens zijn").optional().default("");

/**
 * Een einduur zonder beginuur zegt niets, en een blok over middernacht is in een asiel
 * met dagwerking eerder een tikfout dan een shift.
 */
function controleerUren(
  data: { startTime?: string; endTime?: string },
  ctx: { addIssue: (issue: { code: "custom"; path: string[]; message: string }) => void },
) {
  if (data.endTime && !data.startTime) {
    ctx.addIssue({ code: "custom", path: ["startTime"], message: "Vul eerst een beginuur in" });
  }
  if (data.startTime && data.endTime && data.endTime <= data.startTime) {
    ctx.addIssue({ code: "custom", path: ["endTime"], message: "Einduur moet na het beginuur liggen" });
  }
}

const signUpSchema = z
  .object({ date: dateString, startTime: optionalTime, endTime: optionalTime, note })
  .superRefine((data, ctx) => controleerUren(data, ctx));

const addPersonSchema = z
  .object({
    date: dateString,
    guestName: z
      .string()
      .trim()
      .min(1, "Vul een naam in")
      .max(200, "Naam mag max 200 tekens zijn"),
    startTime: optionalTime,
    endTime: optionalTime,
    note,
  })
  .superRefine((data, ctx) => controleerUren(data, ctx));

/**
 * Postgres "unique_violation": de databank hield een exact dubbel blok tegen.
 * drizzle-orm verpakt elke databankfout in een `DrizzleQueryError`; de Postgres-code
 * zit dan in `cause` (review 14.7 — zelfde patroon als `kennels.ts`).
 */
function isDubbel(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const fout = err as { code?: unknown; cause?: { code?: unknown } };
  return (fout.code ?? fout.cause?.code) === "23505";
}

/** Alle blokken van één dag. Een dag telt er hooguit een paar tientallen. */
function blokkenOpDag(date: string) {
  return db
    .select({
      id: staffAttendance.id,
      userId: staffAttendance.userId,
      guestName: staffAttendance.guestName,
      startTime: staffAttendance.startTime,
      endTime: staffAttendance.endTime,
    })
    .from(staffAttendance)
    .where(eq(staffAttendance.date, date))
    .limit(200);
}

type Blok = {
  userId: number | null;
  guestName: string | null;
  startTime: string | null;
  endTime: string | null;
};

/**
 * Story 14.7 — de gemeenschappelijke stap van jezelf en iemand anders inschrijven:
 * exact hetzelfde blok nog eens = niets doen, een botsend blok = weigeren, anders
 * bewaren. Een dubbel blok dat tussen twee tabbladen door glipt, houdt de databank
 * tegen; dat is dan hetzelfde als "stond al ingeschreven".
 */
async function schrijfIn(
  date: string,
  nieuw: Blok,
  extra: { note: string; createdBy: number },
  wie: string,
): Promise<ActionResult> {
  const bestaande = await blokkenOpDag(date);
  const alGeboekt = { success: true as const, data: undefined, message: `${wie} stond al ingeschreven.` };

  if (bestaande.some((b) => samePerson(b, nieuw) && isSameBlock(b, nieuw))) {
    revalidatePath(PATH);
    return alGeboekt;
  }

  const botsing = findOverlap(bestaande, nieuw);
  if (botsing) {
    return {
      success: false,
      error: `${wie} staat die dag al ingeschreven (${formatTimeRange(botsing)}). Haal dat eerst weg of kies andere uren.`,
    };
  }

  try {
    await db.insert(staffAttendance).values({
      date,
      userId: nieuw.userId,
      guestName: nieuw.guestName,
      startTime: nieuw.startTime,
      endTime: nieuw.endTime,
      note: extra.note || null,
      createdBy: extra.createdBy,
    });
  } catch (err) {
    if (isDubbel(err)) {
      revalidatePath(PATH);
      return alGeboekt;
    }
    return { success: false, error: "Er ging iets mis bij het inschrijven. Probeer het opnieuw." };
  }

  return { success: true, data: undefined };
}

/**
 * Jezelf inschrijven. Vraagt geen schrijfrecht: elk teamlid onderhoudt zijn
 * eigen aanwezigheid, net zoals bij de teamkalender (story 12.2).
 */
export async function signUpForDay(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };

  // Teruggegeven bij een fout: React 19 leegt de velden na een Server Action, en
  // niemand wil na "Einduur moet na het beginuur liggen" alles opnieuw typen.
  const values = {
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    note: String(formData.get("note") ?? ""),
  };

  const parsed = signUpSchema.safeParse({
    date: formData.get("date"),
    // `get` geeft null als het veld ontbreekt, en voor zod is null iets anders
    // dan "niet meegestuurd" — zonder deze omzetting faalt een formulier zonder
    // toelichtings- of uurveld op de validatie.
    startTime: formData.get("startTime") ?? undefined,
    endTime: formData.get("endTime") ?? undefined,
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: "Validatie mislukt",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      values,
    };
  }

  const blok: Blok = {
    userId: session.userId,
    guestName: null,
    startTime: parsed.data.startTime || null,
    endTime: parsed.data.endTime || null,
  };

  const result = await schrijfIn(
    parsed.data.date,
    blok,
    { note: parsed.data.note, createdBy: session.userId },
    "Je",
  );
  if (!result.success) return { ...result, values };
  if (result.message) return result;

  await logAudit("staff_attendance.signed_up", "staff_attendance", session.userId, null, {
    date: parsed.data.date,
    startTime: blok.startTime,
    endTime: blok.endTime,
  });

  revalidatePath(PATH);
  return { success: true, data: undefined, message: "Ingeschreven." };
}

/** Iemand zonder login inschrijven — enkel met schrijfrecht. */
export async function addPersonToDay(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };
  if (!hasPermission(session.role, "staff:write")) {
    return { success: false, error: "Onvoldoende rechten om iemand anders in te schrijven" };
  }

  const values = {
    date: String(formData.get("date") ?? ""),
    guestName: String(formData.get("guestName") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    note: String(formData.get("note") ?? ""),
  };

  const parsed = addPersonSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validatie mislukt",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      values,
    };
  }

  const blok: Blok = {
    userId: null,
    guestName: parsed.data.guestName,
    startTime: parsed.data.startTime || null,
    endTime: parsed.data.endTime || null,
  };

  const result = await schrijfIn(
    parsed.data.date,
    blok,
    { note: parsed.data.note, createdBy: session.userId },
    parsed.data.guestName,
  );
  if (!result.success) return { ...result, values };
  if (result.message) return result;

  await logAudit("staff_attendance.person_added", "staff_attendance", session.userId, null, {
    date: parsed.data.date,
    guestName: parsed.data.guestName,
    startTime: blok.startTime,
    endTime: blok.endTime,
  });

  revalidatePath(PATH);
  return { success: true, data: undefined, message: `${parsed.data.guestName} is ingeschreven.` };
}

/**
 * Een inschrijving weghalen. Je eigen mag altijd; die van iemand anders enkel
 * met schrijfrecht — de controle staat hier, niet enkel in het scherm.
 */
export async function removeAttendance(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };

  const id = Number(formData.get("id"));
  if (!id || id <= 0) return { success: false, error: "Ongeldig ID" };

  const [rij] = await db
    .select({ id: staffAttendance.id, userId: staffAttendance.userId, date: staffAttendance.date })
    .from(staffAttendance)
    .where(eq(staffAttendance.id, id))
    .limit(1);

  if (!rij) return { success: false, error: "Inschrijving niet gevonden" };

  const eigen = rij.userId === session.userId;
  if (!eigen && !hasPermission(session.role, "staff:write")) {
    return { success: false, error: "Je kan enkel je eigen inschrijving weghalen" };
  }

  await db.delete(staffAttendance).where(eq(staffAttendance.id, id));

  await logAudit("staff_attendance.removed", "staff_attendance", id, { date: rij.date }, null);

  revalidatePath(PATH);
  return { success: true, data: undefined, message: "Uitgeschreven." };
}
