import { describe, it, expect } from "vitest";
import {
  buildDaySlots,
  canTakeSlot,
  freePlaces,
  sameKind,
  slotTakers,
  withoutSlotTakers,
  type Slot,
} from "./slots";
import type { AttendanceEntry } from "./attendance";

const slot = (overrides: Partial<Slot> = {}): Slot => ({
  id: 1,
  date: "2026-09-13",
  startTime: "09:00",
  endTime: "12:00",
  task: "Kuis honden",
  capacity: 2,
  note: null,
  ...overrides,
});

const entry = (overrides: Partial<AttendanceEntry> = {}): AttendanceEntry => ({
  id: 10,
  date: "2026-09-13",
  userId: 7,
  userName: "Nathalie",
  userRole: "medewerker",
  guestName: null,
  startTime: "09:00",
  endTime: "12:00",
  task: "Kuis honden",
  slotId: 1,
  note: null,
  ...overrides,
});

describe("slotTakers", () => {
  it("geeft de inschrijvingen die dit plaatsje innemen", () => {
    const takers = slotTakers(slot(), [
      entry({ id: 10, slotId: 1 }),
      entry({ id: 11, slotId: 2 }),
      entry({ id: 12, slotId: null }),
    ]);
    expect(takers.map((t) => t.id)).toEqual([10]);
  });
});

describe("freePlaces", () => {
  it("telt de vrije plaatsen", () => {
    expect(freePlaces(slot({ capacity: 2 }), [entry()])).toBe(1);
  });

  it("gaat nooit onder nul", () => {
    expect(freePlaces(slot({ capacity: 1 }), [entry({ id: 10 }), entry({ id: 11, userId: 8 })])).toBe(0);
  });
});

describe("canTakeSlot", () => {
  it("laat een vrij plaatsje nemen", () => {
    expect(canTakeSlot(slot({ capacity: 2 }), [entry({ userId: 8 })], 7)).toBe(true);
  });

  it("weigert een volzet plaatsje", () => {
    expect(canTakeSlot(slot({ capacity: 1 }), [entry({ userId: 8 })], 7)).toBe(false);
  });

  it("weigert wie het plaatsje al heeft", () => {
    expect(canTakeSlot(slot({ capacity: 2 }), [entry({ userId: 7 })], 7)).toBe(false);
  });

  it("weigert zonder aangemelde gebruiker", () => {
    expect(canTakeSlot(slot(), [], null)).toBe(false);
  });
});

describe("buildDaySlots", () => {
  it("geeft enkel de plaatsjes van die dag, hele dag eerst, dan op beginuur, dan op taak", () => {
    const dag = buildDaySlots(
      "2026-09-13",
      [
        slot({ id: 1, startTime: "14:00", endTime: "17:00", task: "Opruim zolder" }),
        slot({ id: 2, startTime: "09:00", endTime: "12:00", task: "Kuis katten" }),
        slot({ id: 3, startTime: null, endTime: null, task: "Voederen" }),
        slot({ id: 4, startTime: "09:00", endTime: "12:00", task: "Kuis honden" }),
        slot({ id: 5, date: "2026-09-14" }),
      ],
      [],
    );
    expect(dag.map((d) => d.slot.id)).toEqual([3, 4, 2, 1]);
  });

  it("zet de innemers en de vrije plaatsen bij elk plaatsje", () => {
    const [d] = buildDaySlots("2026-09-13", [slot({ id: 1, capacity: 3 })], [
      entry({ id: 10, slotId: 1, userName: "Sven", userId: 20 }),
      entry({ id: 11, slotId: 1, userName: "Anja", userId: 21 }),
    ]);
    expect(d.takers.map((t) => t.userName)).toEqual(["Anja", "Sven"]);
    expect(d.free).toBe(1);
  });
});

describe("withoutSlotTakers", () => {
  it("laat enkel de gewone inschrijvingen over", () => {
    const rest = withoutSlotTakers([entry({ id: 10, slotId: 1 }), entry({ id: 11, slotId: null })]);
    expect(rest.map((e) => e.id)).toEqual([11]);
  });
});

describe("sameKind", () => {
  it("zet gewone blokken bij gewone blokken en plaatsjes bij plaatsjes", () => {
    expect(sameKind({ slotId: null }, { slotId: null })).toBe(true);
    expect(sameKind({ slotId: 1 }, { slotId: 2 })).toBe(true);
    expect(sameKind({ slotId: null }, { slotId: 1 })).toBe(false);
  });

  it("behandelt een ontbrekende slotId als een gewoon blok", () => {
    expect(sameKind({}, { slotId: null })).toBe(true);
  });
});
