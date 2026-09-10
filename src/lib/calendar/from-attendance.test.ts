import { describe, it, expect } from "vitest";
import { attendanceToCalendar } from "./from-attendance";
import type { AttendanceEntry } from "@/lib/staff/attendance";

const entry = (overrides: Partial<AttendanceEntry> = {}): AttendanceEntry => ({
  id: 1,
  date: "2026-09-14",
  userId: 20,
  userName: "Sven",
  userRole: "beheerder",
  guestName: null,
  startTime: null,
  endTime: null,
  task: null,
  note: null,
  ...overrides,
});

describe("attendanceToCalendar", () => {
  it("geeft geen item voor een dag zonder inschrijvingen", () => {
    expect(attendanceToCalendar([])).toEqual([]);
  });

  it("maakt één item per dag, in de categorie Personeel", () => {
    const items = attendanceToCalendar([
      entry({ id: 1, date: "2026-09-14" }),
      entry({ id: 2, date: "2026-09-14", userId: 21, userName: "Jan", userRole: "medewerker" }),
      entry({ id: 3, date: "2026-09-15" }),
    ]);

    expect(items).toHaveLength(2);
    expect(items.map((i) => i.date)).toEqual(["2026-09-14", "2026-09-15"]);
    expect(items.every((i) => i.category === "personeel")).toBe(true);
    expect(items[0].id).toBe("personeel-2026-09-14");
  });

  it("zet de mensen in volgorde van aankomst, met uren en taak", () => {
    const [item] = attendanceToCalendar([
      entry({ id: 1, userName: "Sven", startTime: "14:00", endTime: "17:00", task: "Kuis honden" }),
      entry({ id: 2, userId: 21, userName: "Jan", userRole: "medewerker" }),
      entry({ id: 3, userId: null, userName: null, userRole: null, guestName: "Anja", startTime: "09:00", endTime: "12:00" }),
    ]);

    expect(item.title).toBe("Personeel (3): Jan, Anja 09:00–12:00, Sven 14:00–17:00 (Kuis honden)");
  });

  it("toont een open einde als 'vanaf'", () => {
    const [item] = attendanceToCalendar([entry({ startTime: "13:00" })]);
    expect(item.title).toBe("Personeel (1): Sven vanaf 13:00");
  });

  it("zet geen uur op het item: de uren staan per persoon in de titel", () => {
    const [item] = attendanceToCalendar([entry({ startTime: "09:00", endTime: "12:00" })]);
    expect(item.time).toBeNull();
  });

  it("linkt naar de week van die dag op het personeelsscherm", () => {
    // 2026-09-16 is een woensdag; de week begint op maandag 14 september.
    const [item] = attendanceToCalendar([entry({ date: "2026-09-16" })]);
    expect(item.href).toBe("/beheerder/personeel?week=2026-09-14");
  });
});
