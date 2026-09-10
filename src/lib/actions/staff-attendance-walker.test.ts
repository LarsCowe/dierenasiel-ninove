import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Story 14.4 — een wandelaar inschrijven via zijn account. Apart van
 * `staff-attendance.test.ts` omdat hier de wandelaarsopzoeking gemockt wordt.
 */
const {
  mockGetSession,
  mockHasPermission,
  mockLogAudit,
  mockSelectLimit,
  mockInsertValues,
  mockFindApprovedWalker,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockHasPermission: vi.fn(),
  mockLogAudit: vi.fn(),
  mockSelectLimit: vi.fn(),
  mockInsertValues: vi.fn(),
  mockFindApprovedWalker: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({ where: vi.fn(() => ({ limit: mockSelectLimit })) })),
    })),
    insert: vi.fn(() => ({ values: mockInsertValues })),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  staffAttendance: { id: "id", date: "date", userId: "userId" },
}));

vi.mock("@/lib/queries/staff-attendance", () => ({ findApprovedWalker: mockFindApprovedWalker }));
vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/permissions", () => ({ hasPermission: mockHasPermission }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { addPersonToDay } from "./staff-attendance";

const form = (entries: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
};

const ELS = { userId: 30, name: "Els Wandel" };

beforeEach(() => {
  mockGetSession.mockReset().mockResolvedValue({ userId: 20, role: "beheerder", name: "Sven" });
  mockHasPermission.mockReset().mockReturnValue(true);
  mockLogAudit.mockReset().mockResolvedValue(undefined);
  mockSelectLimit.mockReset().mockResolvedValue([]);
  mockInsertValues.mockReset().mockResolvedValue(undefined);
  mockFindApprovedWalker.mockReset().mockResolvedValue(ELS);
});

describe("addPersonToDay — wandelaar kiezen", () => {
  it("schrijft een wandelaar in via zijn account, niet als losse naam", async () => {
    const result = await addPersonToDay(null, form({ date: "2026-08-16", walkerUserId: "30" }));

    expect(result.success).toBe(true);
    expect(mockFindApprovedWalker).toHaveBeenCalledWith(30);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 30, guestName: null, createdBy: 20 }),
    );
    expect(result.success && result.message).toContain("Els Wandel");
  });

  it("weigert een account dat geen goedgekeurde, actieve wandelaar is", async () => {
    mockFindApprovedWalker.mockResolvedValue(null);

    const result = await addPersonToDay(null, form({ date: "2026-08-16", walkerUserId: "7" }));

    expect(result.success).toBe(false);
    expect(result.success === false && result.fieldErrors?.walkerUserId?.[0]).toBeTruthy();
    expect(result.success === false && result.values?.walkerUserId).toBe("7");
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("weigert iets dat geen nummer is, zonder de databank te raadplegen", async () => {
    const result = await addPersonToDay(null, form({ date: "2026-08-16", walkerUserId: "Els" }));

    expect(result.success).toBe(false);
    expect(mockFindApprovedWalker).not.toHaveBeenCalled();
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  // Code-review 14.4: Postgres weigert een getal buiten het bereik van de id-kolom, en die
  // fout mocht de actie niet laten crashen.
  it("weigert een nummer dat niet in de id-kolom past, zonder de databank te raadplegen", async () => {
    const result = await addPersonToDay(null, form({ date: "2026-08-16", walkerUserId: "99999999999" }));

    expect(result.success).toBe(false);
    expect(result.success === false && result.fieldErrors?.walkerUserId?.[0]).toBeTruthy();
    expect(mockFindApprovedWalker).not.toHaveBeenCalled();
  });

  it("geeft een melding in plaats van te crashen wanneer het opzoeken mislukt", async () => {
    mockFindApprovedWalker.mockRejectedValue(new Error("value out of range for type integer"));

    const result = await addPersonToDay(null, form({ date: "2026-08-16", walkerUserId: "30" }));

    expect(result.success).toBe(false);
    expect(result.success === false && result.fieldErrors?.walkerUserId?.[0]).toBeTruthy();
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("vraagt een naam of een wandelaar", async () => {
    const result = await addPersonToDay(null, form({ date: "2026-08-16", guestName: " ", walkerUserId: "" }));

    expect(result.success).toBe(false);
    expect(result.success === false && result.fieldErrors?.guestName?.[0]).toMatch(/wandelaar/);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("laat de gekozen wandelaar voorgaan op een getypte naam", async () => {
    await addPersonToDay(null, form({ date: "2026-08-16", walkerUserId: "30", guestName: "Tante Marie" }));

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 30, guestName: null }),
    );
  });

  it("weigert een blok dat overlapt met een ander blok van dezelfde wandelaar", async () => {
    mockSelectLimit.mockResolvedValue([
      { id: 9, userId: 30, guestName: null, startTime: "09:00", endTime: "12:00", task: null },
    ]);

    const result = await addPersonToDay(
      null,
      form({ date: "2026-08-16", walkerUserId: "30", startTime: "10:00", endTime: "11:00" }),
    );

    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toContain("Els Wandel");
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("vraagt nog altijd schrijfrecht", async () => {
    mockHasPermission.mockReturnValue(false);

    const result = await addPersonToDay(null, form({ date: "2026-08-16", walkerUserId: "30" }));

    expect(result.success).toBe(false);
    expect(mockFindApprovedWalker).not.toHaveBeenCalled();
  });

  it("schrijft iemand zonder account nog altijd in op naam", async () => {
    const result = await addPersonToDay(null, form({ date: "2026-08-16", guestName: "Tante Marie" }));

    expect(result.success).toBe(true);
    expect(mockFindApprovedWalker).not.toHaveBeenCalled();
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null, guestName: "Tante Marie" }),
    );
  });
});
