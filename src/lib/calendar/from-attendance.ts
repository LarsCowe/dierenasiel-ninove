/**
 * Epic 14, story 14.5 — personeel op de gedeelde teamkalender.
 *
 * Sven, vraag 9 (2026-09-10): "ja dat mag op de kalender dan zien we wie wanneer staat en
 * komt".
 *
 * Eén item per dag met iedereen die komt, niet één per persoon: de maandweergave toont
 * maximaal drie items per dag, en een drukke personeelsdag mag de adopties en
 * dierenartsafspraken niet wegdrukken. De uren staan per persoon in de titel; het item
 * zelf krijgt geen uur. Pure functie, geen database.
 */
import type { CalendarEvent } from "./events";
import {
  compareAttendance,
  displayName,
  formatTimeRange,
  weekStartFor,
  type AttendanceEntry,
} from "@/lib/staff/attendance";

/** "Sven 14:00–17:00 (Kuis honden)", "Jan" of "Anja vanaf 13:00". */
function persoon(entry: AttendanceEntry): string {
  const uren = entry.startTime ? ` ${formatTimeRange(entry)}` : "";
  const taak = entry.task ? ` (${entry.task})` : "";
  return `${displayName(entry)}${uren}${taak}`;
}

export function attendanceToCalendar(entries: readonly AttendanceEntry[]): CalendarEvent[] {
  const perDag = new Map<string, AttendanceEntry[]>();
  for (const entry of entries) {
    const lijst = perDag.get(entry.date) ?? [];
    lijst.push(entry);
    perDag.set(entry.date, lijst);
  }

  return [...perDag.keys()].sort().map((date) => {
    const mensen = [...(perDag.get(date) ?? [])].sort(compareAttendance);
    return {
      id: `personeel-${date}`,
      category: "personeel",
      date,
      time: null,
      title: `Personeel (${mensen.length}): ${mensen.map(persoon).join(", ")}`,
      href: `/beheerder/personeel?week=${weekStartFor(date)}`,
    };
  });
}
