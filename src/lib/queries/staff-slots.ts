import { and, asc, eq, gte, isNotNull, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { staffAttendance, staffSlots } from "@/lib/db/schema";
import type { Slot } from "@/lib/staff/slots";

/** Story 14.3 — de velden van een plaatsje, zoals de rest van de app ze kent. */
const slotVelden = {
  id: staffSlots.id,
  date: staffSlots.date,
  startTime: staffSlots.startTime,
  endTime: staffSlots.endTime,
  task: staffSlots.task,
  capacity: staffSlots.capacity,
  note: staffSlots.note,
};

/** Alle plaatsjes tussen twee datums (inclusief), voor het personeelsscherm. */
export async function getSlotsBetween(start: string, end: string): Promise<Slot[]> {
  try {
    return await db
      .select(slotVelden)
      .from(staffSlots)
      .where(and(gte(staffSlots.date, start), lte(staffSlots.date, end)))
      .orderBy(asc(staffSlots.date), asc(staffSlots.id));
  } catch (err) {
    console.error("getSlotsBetween query failed:", err);
    return [];
  }
}

export async function getSlotById(id: number): Promise<Slot | null> {
  const [row] = await db.select(slotVelden).from(staffSlots).where(eq(staffSlots.id, id)).limit(1);
  return row ?? null;
}

/**
 * Wie dit plaatsje inneemt, in volgorde van aanmaak. Die volgorde is wat telt wanneer twee
 * mensen tegelijk de laatste plaats nemen: wie buiten het aantal valt, was te laat.
 */
export async function getSlotTakers(
  slotId: number,
): Promise<{ id: number; userId: number | null; guestName: string | null }[]> {
  return db
    .select({ id: staffAttendance.id, userId: staffAttendance.userId, guestName: staffAttendance.guestName })
    .from(staffAttendance)
    .where(eq(staffAttendance.slotId, slotId))
    .orderBy(asc(staffAttendance.id));
}

/**
 * De ingenomen plaatsjes van één dag — om na te gaan dat niemand twee plaatsjes tegelijk
 * heeft. Gewone blokken tellen hier bewust niet mee: "hele dag" plus een plaatsje mag.
 */
export async function getSlotRowsOnDay(date: string): Promise<
  {
    id: number;
    userId: number | null;
    guestName: string | null;
    startTime: string | null;
    endTime: string | null;
    slotId: number | null;
  }[]
> {
  return db
    .select({
      id: staffAttendance.id,
      userId: staffAttendance.userId,
      guestName: staffAttendance.guestName,
      startTime: staffAttendance.startTime,
      endTime: staffAttendance.endTime,
      slotId: staffAttendance.slotId,
    })
    .from(staffAttendance)
    .where(and(eq(staffAttendance.date, date), isNotNull(staffAttendance.slotId)));
}
