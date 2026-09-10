import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockInsertReturning, mockInsertValues, mockInsert,
  mockUpdateReturning, mockUpdateWhere, mockUpdateSet, mockUpdate,
  mockDeleteWhere, mockDelete,
  mockSelectLimit, mockSelectWhere, mockSelectFrom, mockSelect,
  mockEventAccess, mockGetSession, mockLogAudit, mockRevalidate,
} = vi.hoisted(() => {
  const mockInsertReturning = vi.fn();
  const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

  const mockUpdateReturning = vi.fn();
  const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning });
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

  const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

  return {
    mockInsertReturning, mockInsertValues, mockInsert,
    mockUpdateReturning, mockUpdateWhere, mockUpdateSet, mockUpdate,
    mockDeleteWhere, mockDelete,
    mockSelectLimit, mockSelectWhere, mockSelectFrom, mockSelect,
    mockEventAccess: vi.fn(), mockGetSession: vi.fn(),
    mockLogAudit: vi.fn(), mockRevalidate: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({
  db: { insert: mockInsert, update: mockUpdate, delete: mockDelete, select: mockSelect },
}));
vi.mock("@/lib/db/schema", () => ({ eventShifts: Symbol("eventShifts") }));
vi.mock("@/lib/events/event-access", () => ({ requireEventDraaiboekAccess: mockEventAccess }));
vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidate }));

import { createEventShift, updateEventShift, deleteEventShift } from "./event-shifts";

function fd(data: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.append(k, v);
  return f;
}

function insertWaarden(n = 0): Record<string, unknown> {
  return (mockInsertValues.mock.calls[n] as unknown[])[0] as Record<string, unknown>;
}

const geldig = {
  eventId: "7",
  date: "2026-11-14",
  startTime: "16:00",
  endTime: "20:00",
  post: "Bar",
  personName: "Katrien",
};
const GEWEIGERD = { success: false as const, error: "Onvoldoende rechten" };

beforeEach(() => {
  vi.clearAllMocks();
  mockEventAccess.mockResolvedValue(undefined);
  mockGetSession.mockResolvedValue({ userId: 7, role: "beheerder" });
  mockLogAudit.mockResolvedValue(undefined);
  mockInsertReturning.mockResolvedValue([{ id: 5, eventId: 7 }]);
  mockUpdateReturning.mockResolvedValue([{ id: 5, eventId: 7 }]);
  mockSelectLimit.mockResolvedValue([{ id: 5, eventId: 7, personName: "Oud" }]);
});

describe("createEventShift", () => {
  it("weigert wie geen toegang heeft tot het evenement", async () => {
    mockEventAccess.mockResolvedValue(GEWEIGERD);
    const res = await createEventShift(null, fd(geldig));
    expect(res).toEqual(GEWEIGERD);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("controleert de toegang op het evenement waar de shift bij komt", async () => {
    await createEventShift(null, fd(geldig));
    expect(mockEventAccess).toHaveBeenCalledWith(7);
  });

  it("bewaart de shift", async () => {
    const res = await createEventShift(null, fd(geldig));
    expect(res.success).toBe(true);
    expect(insertWaarden()).toMatchObject({
      eventId: 7,
      date: "2026-11-14",
      startTime: "16:00",
      endTime: "20:00",
      post: "Bar",
      personName: "Katrien",
    });
  });

  it("bewaart een shift zonder uren als hele dag", async () => {
    await createEventShift(null, fd({ ...geldig, startTime: "", endTime: "" }));
    expect(insertWaarden()).toMatchObject({ startTime: null, endTime: null });
  });

  it("weigert een einduur vóór het beginuur", async () => {
    const res = await createEventShift(null, fd({ ...geldig, startTime: "20:00", endTime: "16:00" }));
    expect(res.success).toBe(false);
    if (!res.success) expect(res.fieldErrors?.endTime?.[0]).toBeTruthy();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("logt de aanmaak en ververst de fiche", async () => {
    await createEventShift(null, fd(geldig));
    expect(mockLogAudit).toHaveBeenCalledWith("create_event_shift", "event_shift", 5, null, expect.anything());
    expect(mockRevalidate).toHaveBeenCalledWith("/beheerder/evenementen/7");
  });
});

describe("updateEventShift", () => {
  it("weigert een ongeldig nummer", async () => {
    const res = await updateEventShift(null, fd({ ...geldig, id: "0" }));
    expect(res.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("meldt een shift die niet meer bestaat", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const res = await updateEventShift(null, fd({ ...geldig, id: "5" }));
    expect(res.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("bewaart de wijziging", async () => {
    const res = await updateEventShift(null, fd({ ...geldig, id: "5", post: "Kassa" }));
    expect(res.success).toBe(true);
    expect((mockUpdateSet.mock.calls[0] as unknown[])[0]).toMatchObject({ post: "Kassa" });
  });

  it("weigert wie geen toegang heeft tot het evenement van de shift", async () => {
    mockEventAccess.mockResolvedValue(GEWEIGERD);
    const res = await updateEventShift(null, fd({ ...geldig, id: "5" }));
    expect(res).toEqual(GEWEIGERD);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("controleert het evenement van de bestaande shift en verhuist ze niet", async () => {
    await updateEventShift(null, fd({ ...geldig, id: "5", eventId: "99" }));
    expect(mockEventAccess).toHaveBeenCalledWith(7);
    expect(mockEventAccess).not.toHaveBeenCalledWith(99);
    expect((mockUpdateSet.mock.calls[0] as unknown[])[0]).toMatchObject({ eventId: 7 });
  });
});

describe("deleteEventShift", () => {
  it("weigert wie geen toegang heeft tot het evenement van de shift", async () => {
    mockEventAccess.mockResolvedValue(GEWEIGERD);
    const res = await deleteEventShift(5);
    expect(res.success).toBe(false);
    expect(mockEventAccess).toHaveBeenCalledWith(7);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("verwijdert de shift en logt dat", async () => {
    const res = await deleteEventShift(5);
    expect(res.success).toBe(true);
    expect(mockLogAudit).toHaveBeenCalledWith("delete_event_shift", "event_shift", 5, expect.anything(), null);
  });
});
