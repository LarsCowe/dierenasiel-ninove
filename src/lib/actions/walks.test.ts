import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockReturning, mockValues, mockInsert,
  mockUpdateReturning, mockUpdateWhere, mockUpdateSet, mockUpdate,
  mockSelectWhere, mockSelectFrom, mockSelect,
  mockSelectLimit, mockSelectOrderBy,
  mockGetSession, mockLogAudit, mockRevalidatePath,
} = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
  const mockUpdateReturning = vi.fn();
  const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning });
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
  const mockSelectOrderBy = vi.fn();
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit, orderBy: mockSelectOrderBy });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });
  const mockGetSession = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  return {
    mockReturning, mockValues, mockInsert,
    mockUpdateReturning, mockUpdateWhere, mockUpdateSet, mockUpdate,
    mockSelectWhere, mockSelectFrom, mockSelect,
    mockSelectLimit, mockSelectOrderBy,
    mockGetSession, mockLogAudit, mockRevalidatePath,
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  walks: {
    id: Symbol("walks.id"),
    walkerId: Symbol("walks.walkerId"),
    status: Symbol("walks.status"),
  },
  walkers: {
    userId: Symbol("walkers.userId"),
    id: Symbol("walkers.id"),
    walkCount: Symbol("walkers.walkCount"),
  },
  animals: {
    id: Symbol("animals.id"),
    species: Symbol("animals.species"),
    isInShelter: Symbol("animals.isInShelter"),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { bookWalk, checkInWalk, checkOutWalk } from "./walks";

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value);
  }
  return fd;
}

const validFormFields = {
  animalId: "5",
  date: "2026-03-15",
  startTime: "10:00",
  remarks: "Graag rustige wandeling",
};

const mockWalker = {
  id: 1,
  userId: 99,
  firstName: "Jan",
  lastName: "Janssens",
  status: "approved",
  isApproved: true,
};

const mockAnimal = {
  id: 5,
  name: "Rex",
  species: "hond",
  isInShelter: true,
};

const mockCreatedWalk = {
  id: 10,
  walkerId: 1,
  animalId: 5,
  date: "2026-03-15",
  startTime: "10:00",
  endTime: null,
  durationMinutes: null,
  remarks: "Graag rustige wandeling",
  status: "planned",
};

describe("bookWalk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 99, role: "wandelaar", email: "jan@example.com", name: "Jan" });
    mockLogAudit.mockResolvedValue(undefined);

    // Default mock chain:
    // 1st select: walker lookup by userId
    // 2nd select: animal lookup by id
    let selectCallCount = 0;
    mockSelectLimit.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return Promise.resolve([mockWalker]);
      if (selectCallCount === 2) return Promise.resolve([mockAnimal]);
      return Promise.resolve([]);
    });

    mockReturning.mockResolvedValue([mockCreatedWalk]);
  });

  it("returns error when not logged in", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await bookWalk(null, makeFormData(validFormFields));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("ingelogd");
    }
  });

  it("returns error when user role is not wandelaar", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "beheerder", email: "admin@test.com", name: "Admin" });

    const result = await bookWalk(null, makeFormData(validFormFields));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it("returns error when walker is not approved", async () => {
    let selectCallCount = 0;
    mockSelectLimit.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return Promise.resolve([{ ...mockWalker, status: "pending", isApproved: false }]);
      return Promise.resolve([]);
    });

    const result = await bookWalk(null, makeFormData(validFormFields));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("goedgekeurd");
    }
  });

  it("returns error when walker profile not found", async () => {
    let selectCallCount = 0;
    mockSelectLimit.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const result = await bookWalk(null, makeFormData(validFormFields));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("profiel");
    }
  });

  it("returns fieldErrors on invalid input", async () => {
    const result = await bookWalk(null, makeFormData({ ...validFormFields, date: "bad-date" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.date).toBeDefined();
    }
  });

  it("returns error when animal is not a dog in shelter", async () => {
    let selectCallCount = 0;
    mockSelectLimit.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return Promise.resolve([mockWalker]);
      if (selectCallCount === 2) return Promise.resolve([{ ...mockAnimal, species: "kat" }]);
      return Promise.resolve([]);
    });

    const result = await bookWalk(null, makeFormData(validFormFields));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("hond");
    }
  });

  it("returns error when animal not found", async () => {
    let selectCallCount = 0;
    mockSelectLimit.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return Promise.resolve([mockWalker]);
      if (selectCallCount === 2) return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const result = await bookWalk(null, makeFormData(validFormFields));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("niet gevonden");
    }
  });

  it("creates walk with status planned and null endTime", async () => {
    await bookWalk(null, makeFormData(validFormFields));

    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        walkerId: 1,
        animalId: 5,
        date: "2026-03-15",
        startTime: "10:00",
        status: "planned",
        endTime: null,
        durationMinutes: null,
      }),
    );
  });

  it("logs audit after booking", async () => {
    await bookWalk(null, makeFormData(validFormFields));

    expect(mockLogAudit).toHaveBeenCalledWith(
      "walk.booked",
      "walk",
      10,
      null,
      expect.objectContaining({ status: "planned" }),
    );
  });

  it("revalidates wandelaar path", async () => {
    await bookWalk(null, makeFormData(validFormFields));

    expect(mockRevalidatePath).toHaveBeenCalledWith("/wandelaar");
  });

  it("returns success with walk data", async () => {
    const result = await bookWalk(null, makeFormData(validFormFields));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(10);
      expect(result.data.status).toBe("planned");
    }
  });
});

const mockPlannedWalk = {
  id: 10,
  walkerId: 1,
  animalId: 5,
  date: "2026-03-15",
  startTime: "10:00",
  endTime: null,
  durationMinutes: null,
  remarks: null,
  status: "planned",
};

describe("checkInWalk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 99, role: "wandelaar", email: "jan@example.com", name: "Jan" });
    mockLogAudit.mockResolvedValue(undefined);
    // Walk lookup
    mockSelectLimit.mockResolvedValue([mockPlannedWalk]);
    // Update returns checked-in walk
    mockUpdateReturning.mockResolvedValue([{ ...mockPlannedWalk, status: "in_progress", startTime: "10:30" }]);
  });

  it("returns error when not logged in", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await checkInWalk(10);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("ingelogd");
  });

  it("returns error when walk not found", async () => {
    let callCount = 0;
    mockSelectLimit.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([mockWalker]);
      if (callCount === 2) return Promise.resolve([]);
      return Promise.resolve([]);
    });
    const result = await checkInWalk(999);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("niet gevonden");
  });

  it("returns error when walk is not in planned status", async () => {
    let callCount = 0;
    mockSelectLimit.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([mockWalker]);
      if (callCount === 2) return Promise.resolve([{ ...mockPlannedWalk, status: "completed" }]);
      return Promise.resolve([]);
    });
    const result = await checkInWalk(10);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("ingecheckt");
  });

  it("returns error when walk belongs to different walker", async () => {
    mockSelectLimit.mockResolvedValue([{ ...mockPlannedWalk, walkerId: 999 }]);
    // Walker lookup returns walker with id 1, but walk belongs to walker 999
    let callCount = 0;
    mockSelectLimit.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([{ ...mockPlannedWalk, walkerId: 999 }]);
      return Promise.resolve([mockWalker]);
    });
    const result = await checkInWalk(10);
    expect(result.success).toBe(false);
  });

  it("updates walk to in_progress with current startTime", async () => {
    // Walker lookup then walk lookup
    let callCount = 0;
    mockSelectLimit.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([mockWalker]);
      if (callCount === 2) return Promise.resolve([mockPlannedWalk]);
      return Promise.resolve([]);
    });

    await checkInWalk(10);

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "in_progress",
      }),
    );
  });

  it("logs audit on check-in", async () => {
    let callCount = 0;
    mockSelectLimit.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([mockWalker]);
      if (callCount === 2) return Promise.resolve([mockPlannedWalk]);
      return Promise.resolve([]);
    });

    await checkInWalk(10);

    expect(mockLogAudit).toHaveBeenCalledWith(
      "walk.checked_in",
      "walk",
      10,
      expect.objectContaining({ status: "planned" }),
      expect.objectContaining({ status: "in_progress" }),
    );
  });

  it("revalidates wandelaar path", async () => {
    let callCount = 0;
    mockSelectLimit.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([mockWalker]);
      if (callCount === 2) return Promise.resolve([mockPlannedWalk]);
      return Promise.resolve([]);
    });

    await checkInWalk(10);

    expect(mockRevalidatePath).toHaveBeenCalledWith("/wandelaar");
  });
});

const mockActiveWalk = {
  id: 10,
  walkerId: 1,
  animalId: 5,
  date: "2026-03-15",
  startTime: "10:00",
  endTime: null,
  durationMinutes: null,
  remarks: null,
  status: "in_progress",
};

describe("checkOutWalk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 99, role: "wandelaar", email: "jan@example.com", name: "Jan" });
    mockLogAudit.mockResolvedValue(undefined);
    // Default: walker lookup then walk lookup
    let callCount = 0;
    mockSelectLimit.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([mockWalker]);
      if (callCount === 2) return Promise.resolve([mockActiveWalk]);
      return Promise.resolve([]);
    });
    mockUpdateReturning.mockResolvedValue([{ ...mockActiveWalk, status: "completed", endTime: "11:30", durationMinutes: 90 }]);
  });

  it("returns error when not logged in", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await checkOutWalk(10, "Goed gedrag");
    expect(result.success).toBe(false);
  });

  it("returns error when walk not found", async () => {
    let callCount = 0;
    mockSelectLimit.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([mockWalker]);
      if (callCount === 2) return Promise.resolve([]);
      return Promise.resolve([]);
    });
    const result = await checkOutWalk(999, "");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("niet gevonden");
  });

  it("returns error when walk is not in_progress", async () => {
    let callCount = 0;
    mockSelectLimit.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([mockWalker]);
      if (callCount === 2) return Promise.resolve([{ ...mockActiveWalk, status: "planned" }]);
      return Promise.resolve([]);
    });
    const result = await checkOutWalk(10, "");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("ingecheckt");
  });

  it("updates walk to completed with endTime and durationMinutes", async () => {
    await checkOutWalk(10, "Goed gedrag");

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        remarks: "Goed gedrag",
      }),
    );
  });

  it("increments walker walkCount", async () => {
    await checkOutWalk(10, "");

    // Second update call should be for walkCount increment
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it("logs audit on check-out", async () => {
    await checkOutWalk(10, "Goed gedrag");

    expect(mockLogAudit).toHaveBeenCalledWith(
      "walk.checked_out",
      "walk",
      10,
      expect.objectContaining({ status: "in_progress" }),
      expect.objectContaining({ status: "completed" }),
    );
  });

  it("revalidates paths", async () => {
    await checkOutWalk(10, "");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/wandelaar");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/wandelaars");
  });
});
