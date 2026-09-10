import { and, asc, eq, gte, isNotNull, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { staffAttendance, users } from "@/lib/db/schema";
import { addDays } from "@/lib/calendar/events";
import type { AttendanceEntry } from "@/lib/staff/attendance";

/**
 * Alle inschrijvingen van één week (maandag t/m zondag). De naam van een account
 * wordt hier opgehaald in plaats van in de rij bewaard, zodat hij klopt na een
 * naamswijziging.
 */
export async function getAttendanceForWeek(weekStart: string): Promise<AttendanceEntry[]> {
  try {
    const weekEnd = addDays(weekStart, 6);

    const rows = await db
      .select({
        id: staffAttendance.id,
        date: staffAttendance.date,
        userId: staffAttendance.userId,
        userName: users.name,
        guestName: staffAttendance.guestName,
        startTime: staffAttendance.startTime,
        endTime: staffAttendance.endTime,
        task: staffAttendance.task,
        note: staffAttendance.note,
      })
      .from(staffAttendance)
      .leftJoin(users, eq(staffAttendance.userId, users.id))
      .where(and(gte(staffAttendance.date, weekStart), lte(staffAttendance.date, weekEnd)))
      .orderBy(asc(staffAttendance.date), asc(staffAttendance.id));

    return rows.map((row) => ({
      ...row,
      userName: row.userName ?? null,
    }));
  } catch (err) {
    console.error("getAttendanceForWeek query failed:", err);
    return [];
  }
}

/**
 * Story 14.2 — de taken die sinds `sinds` al ingevuld werden. Ze komen mee in de
 * voorstellen (`taskSuggestions`); het ontdubbelen gebeurt daar, niet hier.
 */
export async function getRecentAttendanceTasks(sinds: string): Promise<string[]> {
  try {
    const rows = await db
      .selectDistinct({ task: staffAttendance.task })
      .from(staffAttendance)
      .where(and(isNotNull(staffAttendance.task), gte(staffAttendance.date, sinds)))
      .limit(100);
    return rows.map((row) => row.task).filter((task): task is string => Boolean(task));
  } catch (err) {
    console.error("getRecentAttendanceTasks query failed:", err);
    return [];
  }
}
