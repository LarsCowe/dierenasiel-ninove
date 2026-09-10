import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Story 14.2 — een taak bij een aanwezigheid. Apart van `staff-attendance.test.ts`
 * omdat hier ook `db.update` gemockt moet worden.
 */
const {
  mockGetSession,
  mockHasPermission,
  mockLogAudit,
  mockSelectLimit,
  mockInsertValues,
  mockUpdateSet,
  mockUpdateWhere,
} = vi.hoisted(() => {
  const mockUpdateWhere = vi.fn();
  return {
    mockGetSession: vi.fn(),
    mockHasPermission: vi.fn(),
    mockLogAudit: vi.fn(),
    mockSelectLimit: vi.fn(),
    mockInsertValues: vi.fn(),
    mockUpdateWhere,
    mockUpdateSet: vi.fn(() => ({ where: mockUpdateWhere })),
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({ where: vi.fn(() => ({ limit: mockSelectLimit })) })),
    })),
    insert: vi.fn(() => ({ values: mockInsertValues })),
    update: vi.fn(() => ({ set: mockUpdateSet })),
    delete: vi.fn(() => ({ where: vi.fn() })),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  staffAttendance: { id: "id", date: "date", userId: "userId" },
}));

vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/permissions", () => ({ hasPermission: mockHasPermission }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { addPersonToDay, setAttendanceTask, signUpForDay } from "./staff-attendance";

const form = (entries: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
};

beforeEach(() => {
  mockGetSession.mockReset().mockResolvedValue({ userId: 7, role: "medewerker", name: "Nathalie" });
  mockHasPermission.mockReset().mockReturnValue(false);
  mockLogAudit.mockReset().mockResolvedValue(undefined);
  mockSelectLimit.mockReset().mockResolvedValue([]);
  mockInsertValues.mockReset().mockResolvedValue(undefined);
  mockUpdateSet.mockClear();
  mockUpdateWhere.mockReset().mockResolvedValue(undefined);
});

describe("taak bij het inschrijven", () => {
  it("bewaart de taak wanneer je jezelf inschrijft", async () => {
    await signUpForDay(
      null,
      form({ date: "2026-08-16", startTime: "09:00", endTime: "12:00", task: "  Kuis   honden " }),
    );

    expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ task: "Kuis honden" }));
  });

  it("laat de taak leeg wanneer er geen opgegeven is", async () => {
    await signUpForDay(null, form({ date: "2026-08-16" }));

    expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ task: null }));
  });

  it("weigert een taak van meer dan 120 tekens", async () => {
    const result = await signUpForDay(null, form({ date: "2026-08-16", task: "x".repeat(121) }));

    expect(result.success).toBe(false);
    expect(result.success === false && result.fieldErrors?.task?.[0]).toBeTruthy();
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("bewaart de taak bij een vrijwilliger zonder login", async () => {
    mockHasPermission.mockReturnValue(true);

    await addPersonToDay(null, form({ date: "2026-08-16", guestName: "Tante Marie", task: "Haag snoeien" }));

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ guestName: "Tante Marie", task: "Haag snoeien" }),
    );
  });
});

describe("setAttendanceTask", () => {
  const eigen = { id: 5, userId: 7, date: "2026-08-16", task: null };
  const vanIemandAnders = { id: 5, userId: 8, date: "2026-08-16", task: null };

  it("zet een taak bij je eigen inschrijving", async () => {
    mockSelectLimit.mockResolvedValue([eigen]);

    const result = await setAttendanceTask(null, form({ id: "5", task: "Haag snoeien" }));

    expect(result.success).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith({ task: "Haag snoeien" });
  });

  it("wist de taak met een leeg veld", async () => {
    mockSelectLimit.mockResolvedValue([{ ...eigen, task: "Haag snoeien" }]);

    await setAttendanceTask(null, form({ id: "5", task: "  " }));

    expect(mockUpdateSet).toHaveBeenCalledWith({ task: null });
  });

  it("belet dat je een taak toeschrijft aan iemand anders zonder schrijfrecht", async () => {
    mockSelectLimit.mockResolvedValue([vanIemandAnders]);

    const result = await setAttendanceTask(null, form({ id: "5", task: "Zwerfkat ophalen" }));

    expect(result.success).toBe(false);
    expect(mockUpdateSet).not.toHaveBeenCalled();
  });

  it("laat de leiding een taak toeschrijven aan iemand anders", async () => {
    mockHasPermission.mockReturnValue(true);
    mockSelectLimit.mockResolvedValue([vanIemandAnders]);

    const result = await setAttendanceTask(null, form({ id: "5", task: "Zwerfkat ophalen" }));

    expect(result.success).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith({ task: "Zwerfkat ophalen" });
  });

  it("laat de leiding een taak zetten bij een vrijwilliger zonder login", async () => {
    mockHasPermission.mockReturnValue(true);
    mockSelectLimit.mockResolvedValue([{ ...vanIemandAnders, userId: null }]);

    const result = await setAttendanceTask(null, form({ id: "5", task: "Kuis katten" }));

    expect(result.success).toBe(true);
  });

  it("weigert een onbekende inschrijving", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await setAttendanceTask(null, form({ id: "99", task: "Kuis katten" }));

    expect(result.success).toBe(false);
    expect(mockUpdateSet).not.toHaveBeenCalled();
  });

  it("weigert wie niet ingelogd is", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await setAttendanceTask(null, form({ id: "5", task: "Kuis katten" }));

    expect(result.success).toBe(false);
    expect(mockUpdateSet).not.toHaveBeenCalled();
  });

  it("weigert een te lange taak en geeft de invoer terug", async () => {
    mockSelectLimit.mockResolvedValue([eigen]);

    const result = await setAttendanceTask(null, form({ id: "5", task: "x".repeat(121) }));

    expect(result.success).toBe(false);
    expect(result.success === false && result.values?.task).toBe("x".repeat(121));
    expect(mockUpdateSet).not.toHaveBeenCalled();
  });

  it("logt de oude en de nieuwe taak", async () => {
    mockSelectLimit.mockResolvedValue([{ ...eigen, task: "Kuis honden" }]);

    await setAttendanceTask(null, form({ id: "5", task: "Kuis katten" }));

    expect(mockLogAudit).toHaveBeenCalledWith(
      "staff_attendance.task_set",
      "staff_attendance",
      5,
      { task: "Kuis honden" },
      { task: "Kuis katten" },
    );
  });
});

// Code-review 14.2: wie al ingeschreven staat en via "+ nog een blok" enkel een taak
// opgeeft, kreeg "stond al ingeschreven" — en de taak ging stilletjes verloren.
describe("hetzelfde blok opnieuw, mét een taak", () => {
  const heleDag = { id: 3, userId: 7, guestName: null, startTime: null, endTime: null, task: null };

  it("zet de taak op de bestaande inschrijving in plaats van ze weg te gooien", async () => {
    mockSelectLimit.mockResolvedValue([heleDag]);

    const result = await signUpForDay(null, form({ date: "2026-08-16", task: "Kuis honden" }));

    expect(result.success).toBe(true);
    expect(mockInsertValues).not.toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith({ task: "Kuis honden" });
    expect(result.success && result.message).toMatch(/taak/i);
  });

  it("logt de taak die zo bij een bestaande inschrijving komt", async () => {
    mockSelectLimit.mockResolvedValue([heleDag]);

    await signUpForDay(null, form({ date: "2026-08-16", task: "Kuis honden" }));

    expect(mockLogAudit).toHaveBeenCalledWith(
      "staff_attendance.task_set",
      "staff_attendance",
      3,
      { task: null },
      { task: "Kuis honden" },
    );
  });

  it("zegt gewoon 'stond al ingeschreven' wanneer er geen taak bij is", async () => {
    mockSelectLimit.mockResolvedValue([{ ...heleDag, task: "Voederen" }]);

    const result = await signUpForDay(null, form({ date: "2026-08-16" }));

    expect(result.success).toBe(true);
    expect(mockUpdateSet).not.toHaveBeenCalled();
    expect(result.success && result.message).toMatch(/stond al ingeschreven/);
  });

  it("doet niets wanneer dezelfde taak er al staat", async () => {
    mockSelectLimit.mockResolvedValue([{ ...heleDag, task: "Kuis honden" }]);

    await signUpForDay(null, form({ date: "2026-08-16", task: "kuis honden " }));

    expect(mockUpdateSet).not.toHaveBeenCalled();
  });

  it("werkt ook voor een vrijwilliger die de leiding opnieuw toevoegt", async () => {
    mockHasPermission.mockReturnValue(true);
    mockSelectLimit.mockResolvedValue([{ ...heleDag, id: 4, userId: null, guestName: "Tante Marie" }]);

    const result = await addPersonToDay(
      null,
      form({ date: "2026-08-16", guestName: "Tante Marie", task: "Haag snoeien" }),
    );

    expect(result.success).toBe(true);
    expect(mockInsertValues).not.toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith({ task: "Haag snoeien" });
  });
});
