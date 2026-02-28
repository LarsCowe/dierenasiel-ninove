import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockSelectLimit, mockSelectWhere, mockSelectOrderBy, mockSelectFrom,
} = vi.hoisted(() => {
  const mockSelectLimit = vi.fn();
  const mockSelectOrderBy = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectWhere = vi.fn().mockReturnValue({ orderBy: mockSelectOrderBy });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere, orderBy: mockSelectOrderBy });
  return { mockSelectLimit, mockSelectOrderBy, mockSelectWhere, mockSelectFrom };
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
    createdAt: Symbol("adoptionCandidates.createdAt"),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  desc: vi.fn((col: unknown) => ({ type: "desc", col })),
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
    mockSelectLimit.mockResolvedValue([mockCandidate]);
  });

  it("returns candidates list", async () => {
    const result = await getAdoptionCandidates();
    expect(result).toEqual([mockCandidate]);
  });

  it("orders by createdAt desc", async () => {
    await getAdoptionCandidates();
    expect(mockSelectOrderBy).toHaveBeenCalled();
  });

  it("limits to 50 results", async () => {
    await getAdoptionCandidates();
    expect(mockSelectLimit).toHaveBeenCalledWith(50);
  });

  it("returns empty array on error", async () => {
    mockSelectLimit.mockRejectedValue(new Error("DB error"));
    const result = await getAdoptionCandidates();
    expect(result).toEqual([]);
  });
});

describe("getAdoptionCandidateById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockCandidate]);
    // For getById, the chain is: from → where → limit
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });
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
