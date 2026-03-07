import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockSelectLimit, mockSelectWhere, mockSelectOrderBy, mockSelectFrom, mockLeftJoin,
} = vi.hoisted(() => {
  const mockSelectLimit = vi.fn();
  const mockSelectOrderBy = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectWhere = vi.fn().mockReturnValue({ orderBy: mockSelectOrderBy, limit: mockSelectLimit });
  const mockLeftJoin = vi.fn().mockReturnValue({ where: mockSelectWhere, orderBy: mockSelectOrderBy });
  const mockSelectFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin, where: mockSelectWhere, orderBy: mockSelectOrderBy });
  return { mockSelectLimit, mockSelectOrderBy, mockSelectWhere, mockSelectFrom, mockLeftJoin };
});

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  adoptionCandidates: {
    id: Symbol("adoptionCandidates.id"),
    status: Symbol("adoptionCandidates.status"),
    category: Symbol("adoptionCandidates.category"),
    createdAt: Symbol("adoptionCandidates.createdAt"),
    animalId: Symbol("adoptionCandidates.animalId"),
  },
  animals: {
    id: Symbol("animals.id"),
    name: Symbol("animals.name"),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  desc: vi.fn((col: unknown) => ({ type: "desc", col })),
  sql: vi.fn(),
}));

import { getAdoptionCandidates, getAdoptionCandidateById } from "./adoption-candidates";

const mockCandidate = {
  id: 1,
  firstName: "Jan",
  lastName: "Peeters",
  email: "jan@example.com",
  phone: "0471234567",
  address: "Kerkstraat 1",
  animalId: 5,
  requestedAnimalName: null,
  questionnaireAnswers: {},
  category: null,
  categorySetBy: null,
  status: "pending",
  notes: null,
  createdAt: new Date(),
};

describe("getAdoptionCandidates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The query now returns { candidate, animalName } objects
    mockSelectLimit.mockResolvedValue([{ candidate: mockCandidate, animalName: "Rex" }]);
    mockLeftJoin.mockReturnValue({ where: mockSelectWhere, orderBy: mockSelectOrderBy });
    mockSelectOrderBy.mockReturnValue({ limit: mockSelectLimit });
    mockSelectWhere.mockReturnValue({ orderBy: mockSelectOrderBy, limit: mockSelectLimit });
    mockSelectFrom.mockReturnValue({ leftJoin: mockLeftJoin });
  });

  it("returns candidates with animal name", async () => {
    const result = await getAdoptionCandidates();
    expect(result[0].animalName).toBe("Rex");
    expect(result[0].firstName).toBe("Jan");
  });

  it("uses leftJoin with animals table", async () => {
    await getAdoptionCandidates();
    expect(mockLeftJoin).toHaveBeenCalled();
  });

  it("limits to 100 results", async () => {
    await getAdoptionCandidates();
    expect(mockSelectLimit).toHaveBeenCalledWith(100);
  });

  it("returns empty array on error", async () => {
    mockSelectLimit.mockRejectedValue(new Error("DB error"));
    const result = await getAdoptionCandidates();
    expect(result).toEqual([]);
  });

  it("falls back to requestedAnimalName when no join match", async () => {
    mockSelectLimit.mockResolvedValue([{
      candidate: { ...mockCandidate, animalId: null, requestedAnimalName: "Bella" },
      animalName: null,
    }]);
    const result = await getAdoptionCandidates();
    expect(result[0].animalName).toBe("Bella");
  });
});

describe("getAdoptionCandidateById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockCandidate]);
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });
    mockSelectFrom.mockReturnValue({ leftJoin: mockLeftJoin, where: mockSelectWhere });
  });

  it("returns candidate when found", async () => {
    const result = await getAdoptionCandidateById(1);
    expect(result).toEqual(mockCandidate);
  });

  it("returns null when not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await getAdoptionCandidateById(999);
    expect(result).toBeNull();
  });

  it("returns null on error", async () => {
    mockSelectLimit.mockRejectedValue(new Error("DB error"));
    const result = await getAdoptionCandidateById(1);
    expect(result).toBeNull();
  });
});

describe("getAdoptionCandidates with category filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([{ candidate: mockCandidate, animalName: "Rex" }]);
    mockSelectOrderBy.mockReturnValue({ limit: mockSelectLimit });
    mockSelectWhere.mockReturnValue({ orderBy: mockSelectOrderBy, limit: mockSelectLimit });
    mockLeftJoin.mockReturnValue({ where: mockSelectWhere, orderBy: mockSelectOrderBy });
    mockSelectFrom.mockReturnValue({ leftJoin: mockLeftJoin });
  });

  it("filters by category when provided", async () => {
    const result = await getAdoptionCandidates("goede_kandidaat");
    expect(result.length).toBe(1);
    expect(mockSelectWhere).toHaveBeenCalled();
  });

  it("returns all candidates when no filter", async () => {
    const result = await getAdoptionCandidates();
    expect(result.length).toBe(1);
  });

  it("returns empty array on error with filter", async () => {
    mockSelectLimit.mockRejectedValue(new Error("DB error"));
    const result = await getAdoptionCandidates("niet_weerhouden");
    expect(result).toEqual([]);
  });
});
