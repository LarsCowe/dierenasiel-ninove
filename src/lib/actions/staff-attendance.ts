"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { staffAttendance } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { findOverlap, formatTimeRange, isSameBlock, samePerson } from "@/lib/staff/attendance";
import { TASK_MAX_LENGTH, normalizeTask } from "@/lib/staff/tasks";
import { findApprovedWalker } from "@/lib/queries/staff-attendance";
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

// Story 14.2 — vrije tekst met voorstellen; leeg = geen taak.
const TE_LANG = `Taak mag max ${TASK_MAX_LENGTH} tekens zijn`;
const task = z
  .string()
  .optional()
  .transform((v) => normalizeTask(v))
  .refine((v) => v === null || v.length <= TASK_MAX_LENGTH, TE_LANG);

const KIES_WANDELAAR = "Kies een wandelaar uit de lijst";

type Issue = { code: "custom"; path: string[]; message: string };

/**
 * Een einduur zonder beginuur zegt niets, en een blok over middernacht is in een asiel
 * met dagwerking eerder een tikfout dan een shift.
 */
function controleerUren(
  data: { startTime?: string; endTime?: string },
  ctx: { addIssue: (issue: Issue) => void },
) {
  if (data.endTime && !data.startTime) {
    ctx.addIssue({ code: "custom", path: ["startTime"], message: "Vul eerst een beginuur in" });
  }
  if (data.startTime && data.endTime && data.endTime <= data.startTime) {
    ctx.addIssue({ code: "custom", path: ["endTime"], message: "Einduur moet na het beginuur liggen" });
  }
}

const signUpSchema = z
  .object({ date: dateString, startTime: optionalTime, endTime: optionalTime, task, note })
  .superRefine((data, ctx) => controleerUren(data, ctx));

const addPersonSchema = z
  .object({
    date: dateString,
    // Story 14.4 — het account van een gekozen wandelaar. Of dat echt een goedgekeurde
    // wandelaar is, controleert de actie tegen de databank.
    walkerUserId: z
      .string()
      .optional()
      .refine((v) => !v || /^[1-9]\d*$/.test(v), KIES_WANDELAAR)
      .transform((v) => (v ? Number(v) : undefined)),
    guestName: z.string().trim().max(200, "Naam mag max 200 tekens zijn").optional().default(""),
    startTime: optionalTime,
    endTime: optionalTime,
    task,
    note,
  })
  .superRefine((data, ctx) => {
    if (!data.walkerUserId && !data.guestName) {
      ctx.addIssue({ code: "custom", path: ["guestName"], message: "Vul een naam in of kies een wandelaar" });
    }
    controleerUren(data, ctx);
  });

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
      task: staffAttendance.task,
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

function zelfdeTaak(a: string | null, b: string | null): boolean {
  return (a ?? "").toLocaleLowerCase("nl") === (b ?? "").toLocaleLowerCase("nl");
}

/**
 * Story 14.7 — de gemeenschappelijke stap van jezelf en iemand anders inschrijven:
 * exact hetzelfde blok nog eens = niets doen, een botsend blok = weigeren, anders
 * bewaren. Een dubbel blok dat tussen twee tabbladen door glipt, houdt de databank
 * tegen; dat is dan hetzelfde als "stond al ingeschreven".
 */
async function schrijfIn(
  date: string,
  nieuw: Blok,
  extra: { note: string; task: string | null; createdBy: number },
  wie: string,
): Promise<ActionResult> {
  const bestaande = await blokkenOpDag(date);
  const alGeboekt = { success: true as const, data: undefined, message: `${wie} stond al ingeschreven.` };

  const zelfde = bestaande.find((b) => samePerson(b, nieuw) && isSameBlock(b, nieuw));
  if (zelfde) {
    // Code-review 14.2 — wie al ingeschreven staat en via "+ nog een blok" enkel een
    // taak opgeeft, bedoelt: zet die taak bij mijn inschrijving. Niet stilletjes weggooien.
    if (extra.task && !zelfdeTaak(zelfde.task, extra.task)) {
      await db.update(staffAttendance).set({ task: extra.task }).where(eq(staffAttendance.id, zelfde.id));
      await logAudit(
        "staff_attendance.task_set",
        "staff_attendance",
        zelfde.id,
        { task: zelfde.task },
        { task: extra.task },
      );
      revalidatePath(PATH);
      return { success: true, data: undefined, message: "Taak bewaard bij de bestaande inschrijving." };
    }
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
      task: extra.task,
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
    task: String(formData.get("task") ?? ""),
    note: String(formData.get("note") ?? ""),
  };

  const parsed = signUpSchema.safeParse({
    date: formData.get("date"),
    // `get` geeft null als het veld ontbreekt, en voor zod is null iets anders
    // dan "niet meegestuurd" — zonder deze omzetting faalt een formulier zonder
    // toelichtings-, uur- of taakveld op de validatie.
    startTime: formData.get("startTime") ?? undefined,
    endTime: formData.get("endTime") ?? undefined,
    task: formData.get("task") ?? undefined,
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
    { note: parsed.data.note, task: parsed.data.task, createdBy: session.userId },
    "Je",
  );
  if (!result.success) return { ...result, values };
  if (result.message) return result;

  await logAudit("staff_attendance.signed_up", "staff_attendance", session.userId, null, {
    date: parsed.data.date,
    startTime: blok.startTime,
    endTime: blok.endTime,
    task: parsed.data.task,
  });

  revalidatePath(PATH);
  return { success: true, data: undefined, message: "Ingeschreven." };
}

/**
 * Iemand anders inschrijven — enkel met schrijfrecht. Sinds story 14.4 een gekozen
 * wandelaar (via zijn account) of iemand zonder account (op naam).
 */
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
    walkerUserId: String(formData.get("walkerUserId") ?? ""),
    guestName: String(formData.get("guestName") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    task: String(formData.get("task") ?? ""),
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

  const uren = {
    startTime: parsed.data.startTime || null,
    endTime: parsed.data.endTime || null,
  };

  let blok: Blok;
  let wie: string;
  if (parsed.data.walkerUserId) {
    // Story 14.4 — de gekozen wandelaar gaat voor op een getypte naam.
    // Code-review 14.4 — een nummer buiten het bereik van een Postgres-integer laat de
    // databank een fout gooien; dat is gewoon "geen wandelaar", geen crash.
    const wandelaar =
      parsed.data.walkerUserId <= 2_147_483_647
        ? await findApprovedWalker(parsed.data.walkerUserId).catch((err) => {
            console.error("findApprovedWalker failed:", err);
            return null;
          })
        : null;
    if (!wandelaar) {
      return {
        success: false,
        error: "Validatie mislukt",
        fieldErrors: { walkerUserId: [KIES_WANDELAAR] },
        values,
      };
    }
    blok = { userId: wandelaar.userId, guestName: null, ...uren };
    wie = wandelaar.name;
  } else {
    blok = { userId: null, guestName: parsed.data.guestName, ...uren };
    wie = parsed.data.guestName;
  }

  const result = await schrijfIn(
    parsed.data.date,
    blok,
    { note: parsed.data.note, task: parsed.data.task, createdBy: session.userId },
    wie,
  );
  if (!result.success) return { ...result, values };
  if (result.message) return result;

  await logAudit("staff_attendance.person_added", "staff_attendance", session.userId, null, {
    date: parsed.data.date,
    userId: blok.userId,
    guestName: blok.guestName,
    startTime: blok.startTime,
    endTime: blok.endTime,
    task: parsed.data.task,
  });

  revalidatePath(PATH);
  return { success: true, data: undefined, message: `${wie} is ingeschreven.` };
}

/**
 * Story 14.2 — een taak zetten, wijzigen of wissen bij een bestaande inschrijving.
 * Je eigen taak mag je altijd aanpassen; iemand anders een taak toeschrijven is de
 * leiding (`staff:write`) — de controle staat hier, niet enkel in het scherm.
 */
export async function setAttendanceTask(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };

  const id = Number(formData.get("id"));
  if (!id || id <= 0) return { success: false, error: "Ongeldig ID" };

  const values = { id: String(formData.get("id") ?? ""), task: String(formData.get("task") ?? "") };
  const nieuweTaak = normalizeTask(values.task);
  if (nieuweTaak && nieuweTaak.length > TASK_MAX_LENGTH) {
    return { success: false, error: "Validatie mislukt", fieldErrors: { task: [TE_LANG] }, values };
  }

  const [rij] = await db
    .select({
      id: staffAttendance.id,
      userId: staffAttendance.userId,
      date: staffAttendance.date,
      task: staffAttendance.task,
    })
    .from(staffAttendance)
    .where(eq(staffAttendance.id, id))
    .limit(1);

  if (!rij) return { success: false, error: "Inschrijving niet gevonden" };

  const eigen = rij.userId === session.userId;
  if (!eigen && !hasPermission(session.role, "staff:write")) {
    return { success: false, error: "Enkel de leiding kan iemand anders een taak geven" };
  }

  await db.update(staffAttendance).set({ task: nieuweTaak }).where(eq(staffAttendance.id, id));

  await logAudit("staff_attendance.task_set", "staff_attendance", id, { task: rij.task }, { task: nieuweTaak });

  revalidatePath(PATH);
  return { success: true, data: undefined, message: nieuweTaak ? "Taak bewaard." : "Taak gewist." };
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
