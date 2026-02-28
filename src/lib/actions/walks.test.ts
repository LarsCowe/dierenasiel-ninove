import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockReturning, mockValues, mockInsert,
  mockSelectWhere, mockSelectFrom, mockSelect,
  mockSelectLimit, mockSelectOrderBy,
  mockGetSession, mockLogAudit, mockRevalidatePath,
} = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
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
    mockSelectWhere, mockSelectFrom, mockSelect,
    mockSelectLimit, mockSelectOrderBy,
    mockGetSession, mockLogAudit, mockRevalidatePath,
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    insert: mockInsert,
    select: mockSelect,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  walks: {
    id: Symbol("walks.id"),
    walkerId: Symbol("walks.walkerId"),
  },
  walkers: {
    userId: Symbol("walkers.userId"),
    id: Symbol("walkers.id"),
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

import { bookWalk } from "./walks";

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
