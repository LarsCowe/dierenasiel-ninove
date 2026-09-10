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
vi.mock("@/lib/db/schema", () => ({ eventTasks: Symbol("eventTasks") }));
vi.mock("@/lib/events/event-access", () => ({ requireEventDraaiboekAccess: mockEventAccess }));
vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidate }));

import {
  createEventTask,
  updateEventTask,
  deleteEventTask,
  toggleEventTask,
} from "./event-tasks";

function fd(data: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.append(k, v);
  return f;
}

const geldig = { eventId: "4", phase: "voorbereiding", title: "Zaal reserveren" };
const GEWEIGERD = { success: false as const, error: "Onvoldoende rechten" };

beforeEach(() => {
  vi.clearAllMocks();
  // Story 13.14: beheerder óf trekker van dít evenement — undefined = mag.
  mockEventAccess.mockResolvedValue(undefined);
  mockGetSession.mockResolvedValue({ userId: 7, role: "beheerder" });
  mockLogAudit.mockResolvedValue(undefined);
});

describe("createEventTask", () => {
  beforeEach(() => {
    mockInsertReturning.mockResolvedValue([{ id: 11, eventId: 4, title: "Zaal reserveren" }]);
  });

  it("weigert wie geen toegang heeft tot het evenement", async () => {
    mockEventAccess.mockResolvedValue(GEWEIGERD);
    const res = await createEventTask(null, fd(geldig));
    expect(res).toEqual(GEWEIGERD);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("controleert de toegang op het evenement waar de taak bij komt", async () => {
    await createEventTask(null, fd(geldig));
    expect(mockEventAccess).toHaveBeenCalledWith(4);
  });

  it("valideert de omschrijving", async () => {
    const res = await createEventTask(null, fd({ ...geldig, title: "" }));
    expect(res.success).toBe(false);
    if (!res.success) expect(res.fieldErrors?.title).toBeDefined();
  });

  it("slaat een taak op bij het juiste evenement", async () => {
    const res = await createEventTask(
      null,
      fd({ ...geldig, date: "2026-09-01", time: "09:00", responsible: "Katrien" }),
    );
    expect(res.success).toBe(true);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 4,
        phase: "voorbereiding",
        title: "Zaal reserveren",
        date: "2026-09-01",
        time: "09:00",
        responsible: "Katrien",
      }),
    );
    expect(mockRevalidate).toHaveBeenCalledWith("/beheerder/evenementen/4");
  });

  it("bewaart lege datum en uur als null", async () => {
    await createEventTask(null, fd({ ...geldig, date: "", time: "", responsible: "" }));
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ date: null, time: null, responsible: null }),
    );
  });
});

describe("updateEventTask", () => {
  beforeEach(() => {
    mockSelectLimit.mockResolvedValue([{ id: 11, eventId: 4, title: "Oud" }]);
    mockUpdateReturning.mockResolvedValue([{ id: 11, eventId: 4, title: "Zaal reserveren" }]);
  });

  it("werkt een bestaande taak bij", async () => {
    const res = await updateEventTask(null, fd({ id: "11", ...geldig }));
    expect(res.success).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ title: "Zaal reserveren" }));
  });

  it("faalt wanneer de taak niet bestaat", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const res = await updateEventTask(null, fd({ id: "99", ...geldig }));
    expect(res.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("weigert wie geen toegang heeft tot het evenement van de taak", async () => {
    mockEventAccess.mockResolvedValue(GEWEIGERD);
    const res = await updateEventTask(null, fd({ id: "11", ...geldig }));
    expect(res).toEqual(GEWEIGERD);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("controleert de toegang op het evenement van de bestaande taak, niet op wat het formulier meestuurt", async () => {
    // Een trekker van evenement 99 mag via een aangepast formulier geen taak van evenement 4 bewerken.
    await updateEventTask(null, fd({ id: "11", ...geldig, eventId: "99" }));
    expect(mockEventAccess).toHaveBeenCalledWith(4);
    expect(mockEventAccess).not.toHaveBeenCalledWith(99);
  });

  it("verhuist een taak niet naar een ander evenement", async () => {
    await updateEventTask(null, fd({ id: "11", ...geldig, eventId: "99" }));
    expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ eventId: 4 }));
    expect(mockRevalidate).toHaveBeenCalledWith("/beheerder/evenementen/4");
  });
});

describe("toggleEventTask", () => {
  beforeEach(() => {
    mockSelectLimit.mockResolvedValue([{ id: 11, eventId: 4, done: false }]);
    mockUpdateReturning.mockResolvedValue([{ id: 11, eventId: 4, done: true }]);
  });

  it("vinkt een taak af en bewaart wie en wanneer", async () => {
    const res = await toggleEventTask(11, true);
    expect(res.success).toBe(true);
    const gezet = mockUpdateSet.mock.calls[0][0];
    expect(gezet.done).toBe(true);
    expect(gezet.doneByUserId).toBe(7);
    expect(gezet.doneAt).toBeInstanceOf(Date);
  });

  it("wist wie en wanneer bij het uitvinken", async () => {
    mockUpdateReturning.mockResolvedValue([{ id: 11, eventId: 4, done: false }]);
    await toggleEventTask(11, false);
    const gezet = mockUpdateSet.mock.calls[0][0];
    expect(gezet.done).toBe(false);
    expect(gezet.doneAt).toBeNull();
    expect(gezet.doneByUserId).toBeNull();
  });

  it("controleert de toegang op het evenement van de taak", async () => {
    await toggleEventTask(11, true);
    expect(mockEventAccess).toHaveBeenCalledWith(4);
  });

  it("weigert wie geen toegang heeft", async () => {
    mockEventAccess.mockResolvedValue(GEWEIGERD);
    const res = await toggleEventTask(11, true);
    expect(res.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("deleteEventTask", () => {
  it("verwijdert een bestaande taak", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 11, eventId: 4, title: "Weg" }]);
    const res = await deleteEventTask(11);
    expect(res.success).toBe(true);
    expect(mockDeleteWhere).toHaveBeenCalled();
    expect(mockRevalidate).toHaveBeenCalledWith("/beheerder/evenementen/4");
  });

  it("faalt wanneer de taak niet bestaat", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const res = await deleteEventTask(99);
    expect(res.success).toBe(false);
    expect(mockDeleteWhere).not.toHaveBeenCalled();
  });

  it("weigert wie geen toegang heeft tot het evenement van de taak", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 11, eventId: 4, title: "Weg" }]);
    mockEventAccess.mockResolvedValue(GEWEIGERD);
    const res = await deleteEventTask(11);
    expect(res.success).toBe(false);
    expect(mockEventAccess).toHaveBeenCalledWith(4);
    expect(mockDeleteWhere).not.toHaveBeenCalled();
  });
});
