import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Story 14.3 — plaatsjes per tijdsblok. De databank-lezingen van de plaatsjes zitten
 * in `@/lib/queries/staff-slots` en worden hier gemockt; `db` enkel voor schrijven
 * (en voor de acties van `staff-attendance`, die hun eigen rijen lezen).
 */
const {
  mockGetSession,
  mockHasPermission,
  mockLogAudit,
  mockInsertValues,
  mockInsertReturning,
  mockDeleteWhere,
  mockUpdate,
  mockSelectLimit,
  mockGetSlotById,
  mockGetSlotTakers,
  mockGetSlotRowsOnDay,
  mockFindApprovedWalker,
} = vi.hoisted(() => {
  const mockInsertReturning = vi.fn();
  return {
    mockGetSession: vi.fn(),
    mockHasPermission: vi.fn(),
    mockLogAudit: vi.fn(),
    mockInsertReturning,
    mockInsertValues: vi.fn(() => {
      const p = Promise.resolve(undefined);
      return Object.assign(p, { returning: mockInsertReturning });
    }),
    mockDeleteWhere: vi.fn(),
    mockUpdate: vi.fn(),
    mockSelectLimit: vi.fn(),
    mockGetSlotById: vi.fn(),
    mockGetSlotTakers: vi.fn(),
    mockGetSlotRowsOnDay: vi.fn(),
    mockFindApprovedWalker: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({ where: vi.fn(() => ({ limit: mockSelectLimit })) })),
    })),
    insert: vi.fn(() => ({ values: mockInsertValues })),
    update: mockUpdate,
    delete: vi.fn(() => ({ where: mockDeleteWhere })),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  staffAttendance: { id: "id", date: "date", userId: "userId", slotId: "slotId" },
  staffSlots: { id: "id" },
}));

vi.mock("@/lib/queries/staff-slots", () => ({
  getSlotById: mockGetSlotById,
  getSlotTakers: mockGetSlotTakers,
  getSlotRowsOnDay: mockGetSlotRowsOnDay,
}));
vi.mock("@/lib/queries/staff-attendance", () => ({ findApprovedWalker: mockFindApprovedWalker }));
vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/permissions", () => ({ hasPermission: mockHasPermission }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { assignToSlot, createSlot, deleteSlot, takeSlot } from "./staff-slots";
import { setAttendanceTask, signUpForDay } from "./staff-attendance";

const form = (entries: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
};

const SLOT = {
  id: 5,
  date: "2026-09-13",
  startTime: "09:00",
  endTime: "12:00",
  task: "Kuis honden",
  capacity: 2,
  note: null,
};

/** Rechten per test: `rechten("staff:read")` = enkel lezen. */
function rechten(...toegekend: string[]) {
  mockHasPermission.mockImplementation((_rol: string, p: string) => toegekend.includes(p));
}

beforeEach(() => {
  mockGetSession.mockReset().mockResolvedValue({ userId: 7, role: "medewerker", name: "Nathalie" });
  rechten("staff:read", "staff:write");
  mockLogAudit.mockReset().mockResolvedValue(undefined);
  mockInsertValues.mockClear();
  mockInsertReturning.mockReset().mockResolvedValue([{ id: 100 }]);
  mockDeleteWhere.mockReset().mockResolvedValue(undefined);
  mockUpdate.mockReset();
  mockSelectLimit.mockReset().mockResolvedValue([]);
  mockGetSlotById.mockReset().mockResolvedValue(SLOT);
  // 1e oproep = vóór het nemen, 2e = het natellen erna.
  mockGetSlotTakers.mockReset().mockResolvedValue([]);
  mockGetSlotRowsOnDay.mockReset().mockResolvedValue([]);
  mockFindApprovedWalker.mockReset().mockResolvedValue({ userId: 30, name: "Els Wandel" });
});

function insertWaarden(): Record<string, unknown> {
  return (mockInsertValues.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
}

describe("createSlot", () => {
  const geldig = { date: "2026-09-13", startTime: "09:00", endTime: "12:00", task: "Kuis honden", capacity: "2" };

  it("weigert zonder schrijfrecht", async () => {
    rechten("staff:read");
    const result = await createSlot(null, form(geldig));
    expect(result.success).toBe(false);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("zet een plaatsje klaar en logt het nieuwe plaatsje", async () => {
    const result = await createSlot(null, form({ ...geldig, task: "  Kuis   honden " }));
    expect(result.success).toBe(true);
    expect(insertWaarden()).toMatchObject({
      date: "2026-09-13",
      startTime: "09:00",
      endTime: "12:00",
      task: "Kuis honden",
      capacity: 2,
      createdBy: 7,
    });
    expect(mockLogAudit).toHaveBeenCalledWith(
      "staff_slot.created", "staff_slot", 100, null, expect.objectContaining({ task: "Kuis honden" }),
    );
  });

  it("bewaart een plaatsje zonder uren als hele dag", async () => {
    await createSlot(null, form({ ...geldig, startTime: "", endTime: "" }));
    expect(insertWaarden()).toMatchObject({ startTime: null, endTime: null });
  });

  it("eist een taak en geeft de invoer terug", async () => {
    const result = await createSlot(null, form({ ...geldig, task: " " }));
    expect(result.success).toBe(false);
    expect(result.success === false && result.fieldErrors?.task?.[0]).toBeTruthy();
    expect(result.success === false && result.values?.capacity).toBe("2");
  });

  it("vraagt tussen 1 en 20 plaatsen", async () => {
    expect((await createSlot(null, form({ ...geldig, capacity: "0" }))).success).toBe(false);
    expect((await createSlot(null, form({ ...geldig, capacity: "21" }))).success).toBe(false);
    expect((await createSlot(null, form({ ...geldig, capacity: "twee" }))).success).toBe(false);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("weigert een einduur vóór het beginuur", async () => {
    const result = await createSlot(null, form({ ...geldig, startTime: "12:00", endTime: "09:00" }));
    expect(result.success).toBe(false);
    expect(result.success === false && result.fieldErrors?.endTime?.[0]).toBeTruthy();
  });
});

describe("deleteSlot", () => {
  it("weigert zonder schrijfrecht", async () => {
    rechten("staff:read");
    expect((await deleteSlot(null, form({ id: "5" }))).success).toBe(false);
    expect(mockDeleteWhere).not.toHaveBeenCalled();
  });

  it("verwijdert een leeg plaatsje en logt dat", async () => {
    const result = await deleteSlot(null, form({ id: "5" }));
    expect(result.success).toBe(true);
    expect(mockDeleteWhere).toHaveBeenCalled();
    expect(mockLogAudit).toHaveBeenCalledWith("staff_slot.deleted", "staff_slot", 5, expect.anything(), null);
  });

  it("weigert een plaatsje waar al iemand op staat, en zegt hoeveel", async () => {
    mockGetSlotTakers.mockResolvedValue([{ id: 10, userId: 8, guestName: null }, { id: 11, userId: 9, guestName: null }]);
    const result = await deleteSlot(null, form({ id: "5" }));
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toContain("2");
    expect(mockDeleteWhere).not.toHaveBeenCalled();
  });

  it("meldt een plaatsje dat niet bestaat", async () => {
    mockGetSlotById.mockResolvedValue(null);
    expect((await deleteSlot(null, form({ id: "99" }))).success).toBe(false);
  });
});

describe("takeSlot", () => {
  it("weigert wie niet ingelogd is", async () => {
    mockGetSession.mockResolvedValue(null);
    expect((await takeSlot(null, form({ slotId: "5" }))).success).toBe(false);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("weigert wie de planning niet mag zien", async () => {
    rechten();
    expect((await takeSlot(null, form({ slotId: "5" }))).success).toBe(false);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("neemt een vrij plaatsje, met de uren en de taak van het plaatsje", async () => {
    mockGetSlotTakers.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 100, userId: 7, guestName: null }]);
    const result = await takeSlot(null, form({ slotId: "5" }));
    expect(result.success).toBe(true);
    expect(insertWaarden()).toMatchObject({
      date: "2026-09-13",
      userId: 7,
      guestName: null,
      startTime: "09:00",
      endTime: "12:00",
      task: "Kuis honden",
      slotId: 5,
      createdBy: 7,
    });
    expect(mockLogAudit).toHaveBeenCalledWith("staff_slot.taken", "staff_attendance", 100, null, expect.anything());
  });

  it("neemt een plaatsje ook als je al de hele dag ingeschreven staat", async () => {
    // Gewone blokken tellen niet mee: `getSlotRowsOnDay` geeft enkel plaatsjes.
    mockGetSlotRowsOnDay.mockResolvedValue([]);
    mockGetSlotTakers.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 100, userId: 7, guestName: null }]);
    expect((await takeSlot(null, form({ slotId: "5" }))).success).toBe(true);
  });

  it("geeft geen fout wanneer je het plaatsje al had", async () => {
    mockGetSlotTakers.mockResolvedValue([{ id: 10, userId: 7, guestName: null }]);
    const result = await takeSlot(null, form({ slotId: "5" }));
    expect(result.success).toBe(true);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("weigert een volzet plaatsje", async () => {
    mockGetSlotTakers.mockResolvedValue([
      { id: 10, userId: 8, guestName: null },
      { id: 11, userId: 9, guestName: null },
    ]);
    const result = await takeSlot(null, form({ slotId: "5" }));
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toMatch(/volzet/);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("weigert een plaatsje dat overlapt met een ander plaatsje van jezelf", async () => {
    mockGetSlotRowsOnDay.mockResolvedValue([
      { id: 20, userId: 7, guestName: null, startTime: "11:00", endTime: "13:00", slotId: 6 },
    ]);
    const result = await takeSlot(null, form({ slotId: "5" }));
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toContain("11:00–13:00");
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("geeft de plaats terug wanneer iemand anders je net voor was", async () => {
    // Na het bewaren staan er drie op een plaatsje van twee — en onze rij (100) is de laatste.
    mockGetSlotTakers.mockResolvedValueOnce([{ id: 90, userId: 8, guestName: null }]).mockResolvedValueOnce([
      { id: 90, userId: 8, guestName: null },
      { id: 95, userId: 9, guestName: null },
      { id: 100, userId: 7, guestName: null },
    ]);
    const result = await takeSlot(null, form({ slotId: "5" }));
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toMatch(/net volzet/i);
    expect(mockDeleteWhere).toHaveBeenCalled();
  });

  it("legt uit wat er botst wanneer je al op hetzelfde uur ingeschreven staat", async () => {
    mockInsertReturning.mockRejectedValue(Object.assign(new Error("Failed query"), { cause: { code: "23505" } }));
    const result = await takeSlot(null, form({ slotId: "5" }));
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toContain("vanaf 09:00");
  });

  it("meldt een plaatsje dat niet bestaat", async () => {
    mockGetSlotById.mockResolvedValue(null);
    expect((await takeSlot(null, form({ slotId: "99" }))).success).toBe(false);
  });
});

describe("assignToSlot", () => {
  it("weigert zonder schrijfrecht", async () => {
    rechten("staff:read");
    expect((await assignToSlot(null, form({ slotId: "5", walkerUserId: "30" }))).success).toBe(false);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("zet een wandelaar op het plaatsje, via zijn account", async () => {
    mockGetSlotTakers.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 100, userId: 30, guestName: null }]);
    const result = await assignToSlot(null, form({ slotId: "5", walkerUserId: "30" }));
    expect(result.success).toBe(true);
    expect(insertWaarden()).toMatchObject({ userId: 30, guestName: null, slotId: 5, task: "Kuis honden", createdBy: 7 });
    expect(result.success && result.message).toContain("Els Wandel");
  });

  it("zet iemand zonder account op het plaatsje, op naam", async () => {
    mockGetSlotTakers.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 100, userId: null, guestName: "Tante Marie" }]);
    const result = await assignToSlot(null, form({ slotId: "5", guestName: "Tante Marie" }));
    expect(result.success).toBe(true);
    expect(insertWaarden()).toMatchObject({ userId: null, guestName: "Tante Marie", slotId: 5 });
  });

  it("vraagt een wandelaar of een naam", async () => {
    const result = await assignToSlot(null, form({ slotId: "5", guestName: " " }));
    expect(result.success).toBe(false);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("weigert een account dat geen goedgekeurde wandelaar is", async () => {
    mockFindApprovedWalker.mockResolvedValue(null);
    const result = await assignToSlot(null, form({ slotId: "5", walkerUserId: "7" }));
    expect(result.success).toBe(false);
    expect(result.success === false && result.fieldErrors?.walkerUserId?.[0]).toBeTruthy();
  });

  it("zet dezelfde vrijwilliger geen twee keer op hetzelfde plaatsje", async () => {
    mockGetSlotTakers.mockResolvedValue([{ id: 10, userId: null, guestName: "tante marie" }]);
    const result = await assignToSlot(null, form({ slotId: "5", guestName: "Tante Marie" }));
    expect(result.success).toBe(true);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });
});

// De kernkeuze van 14.3: overlap enkel binnen dezelfde soort.
describe("gewone inschrijvingen naast een plaatsje", () => {
  it("laat 'Ik kom' voor de hele dag toe terwijl je al een plaatsje hebt", async () => {
    mockSelectLimit.mockResolvedValue([
      { id: 20, userId: 7, guestName: null, startTime: "09:00", endTime: "12:00", task: "Kuis honden", slotId: 5 },
    ]);
    const result = await signUpForDay(null, form({ date: "2026-09-13" }));
    expect(result.success).toBe(true);
    expect(insertWaarden()).toMatchObject({ userId: 7, startTime: null, slotId: null });
  });

  // Code-review 14.3: de uniciteitsregel telt ook de plaatsjes-rijen. Een gewoon blok op
  // hetzelfde beginuur als een eigen plaatsje botste in de databank — en die fout werd
  // gelezen als "stond al ingeschreven", terwijl er niets bewaard was.
  it("weigert eerlijk 'Ik kom' (hele dag) naast een plaatsje voor de hele dag", async () => {
    mockSelectLimit.mockResolvedValue([
      { id: 20, userId: 7, guestName: null, startTime: null, endTime: null, task: "Voederen", slotId: 5 },
    ]);
    const result = await signUpForDay(null, form({ date: "2026-09-13" }));
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toMatch(/plaatsje/);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("weigert eerlijk een gewoon blok dat op hetzelfde uur begint als je plaatsje", async () => {
    mockSelectLimit.mockResolvedValue([
      { id: 20, userId: 7, guestName: null, startTime: "09:00", endTime: "11:00", task: "Kuis honden", slotId: 5 },
    ]);
    const result = await signUpForDay(null, form({ date: "2026-09-13", startTime: "09:00", endTime: "10:00" }));
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toContain("09:00");
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("laat de taak van een ingenomen plaatsje niet los aanpassen", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 20, userId: 7, date: "2026-09-13", task: "Kuis honden", slotId: 5 }]);
    const result = await setAttendanceTask(null, form({ id: "20", task: "Voederen" }));
    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toMatch(/plaatsje/);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
