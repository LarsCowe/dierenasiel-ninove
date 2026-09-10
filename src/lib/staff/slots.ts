/**
 * Epic 14, story 14.3 — plaatsjes per tijdsblok.
 *
 * Sven (2026-08-10): "zondag 2 plaatsjes voor kuis honden, 1 plaatsje kuis katten, 1 opruim
 * zolder, … op de plaatsjes zou dan personeel kunnen invullen".
 *
 * Een plaatsje is vraag (wat de leiding klaarzet); een inschrijving met `slotId` is wie het
 * inneemt. Overlap wordt enkel binnen dezelfde soort nagekeken: "hele dag" plus een
 * plaatsje mag, twee overlappende plaatsjes niet (`sameKind`).
 *
 * Pure logica, geen database.
 */
import { compareAttendance, type AttendanceEntry } from "./attendance";

export interface Slot {
  id: number;
  /** YYYY-MM-DD */
  date: string;
  /** "HH:MM". Leeg = de hele dag. */
  startTime: string | null;
  endTime: string | null;
  task: string;
  capacity: number;
  note: string | null;
}

/** Meer dan twintig mensen op één klus is een evenement, geen plaatsje. */
export const SLOT_MAX_CAPACITY = 20;

export function slotTakers<T extends { slotId: number | null }>(
  slot: Pick<Slot, "id">,
  entries: readonly T[],
): T[] {
  return entries.filter((e) => e.slotId === slot.id);
}

export function freePlaces(slot: Pick<Slot, "capacity">, takers: readonly unknown[]): number {
  return Math.max(0, slot.capacity - takers.length);
}

/** Kan deze gebruiker dit plaatsje nog nemen? Niet als het volzet is of als hij het al heeft. */
export function canTakeSlot(
  slot: Pick<Slot, "capacity">,
  takers: readonly { userId: number | null }[],
  userId: number | null,
): boolean {
  if (userId === null) return false;
  if (takers.some((t) => t.userId === userId)) return false;
  return freePlaces(slot, takers) > 0;
}

export interface DaySlot {
  slot: Slot;
  takers: AttendanceEntry[];
  free: number;
}

/** Hele dag eerst, dan op beginuur, dan op taak — zoals de inschrijvingen zelf. */
function slotVolgorde(a: Slot, b: Slot): number {
  const aStart = a.startTime ?? "";
  const bStart = b.startTime ?? "";
  if (aStart !== bStart) return aStart < bStart ? -1 : 1;
  return a.task.localeCompare(b.task, "nl", { sensitivity: "base" });
}

export function buildDaySlots(
  date: string,
  slots: readonly Slot[],
  entries: readonly AttendanceEntry[],
): DaySlot[] {
  return slots
    .filter((s) => s.date === date)
    .sort(slotVolgorde)
    .map((slot) => {
      const takers = slotTakers(slot, entries).sort(compareAttendance);
      return { slot, takers, free: freePlaces(slot, takers) };
    });
}

/** De gewone inschrijvingen: wie op een plaatsje staat, verschijnt bij dat plaatsje. */
export function withoutSlotTakers<T extends { slotId?: number | null }>(entries: readonly T[]): T[] {
  return entries.filter((e) => e.slotId == null);
}

/** Gewoon blok bij gewoon blok, plaatsje bij plaatsje. Een ontbrekende slotId = gewoon. */
export function sameKind(a: { slotId?: number | null }, b: { slotId?: number | null }): boolean {
  return (a.slotId == null) === (b.slotId == null);
}
