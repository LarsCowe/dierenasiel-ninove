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
  kennismakingen: {
    id: Symbol("kennismakingen.id"),
    adoptionCandidateId: Symbol("kennismakingen.adoptionCandidateId"),
    createdAt: Symbol("kennismakingen.createdAt"),
    scheduledAt: Symbol("kennismakingen.scheduledAt"),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  desc: vi.fn((col: unknown) => ({ type: "desc", col })),
}));

import { getKennismakingenByCandidateId, getKennismakingById } from "./kennismakingen";

const mockKennismaking = {
  id: 1,
  adoptionCandidateId: 5,
  animalId: 10,
  scheduledAt: new Date("2026-03-10T14:00:00Z"),
  location: "Bezoekruimte A",
  status: "scheduled",
  outcome: null,
  notes: null,
  createdBy: "Marie Janssens",
  createdAt: new Date(),
};

describe("getKennismakingenByCandidateId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectOrderBy.mockReturnValue({ limit: mockSelectLimit });
    mockSelectWhere.mockReturnValue({ orderBy: mockSelectOrderBy });
    mockSelectLimit.mockResolvedValue([mockKennismaking]);
  });

  it("returns kennismakingen for candidate", async () => {
    const result = await getKennismakingenByCandidateId(5);
    expect(result).toEqual([mockKennismaking]);
    expect(mockSelectWhere).toHaveBeenCalled();
  });

  it("returns empty array on error", async () => {
    mockSelectLimit.mockRejectedValue(new Error("DB error"));
    const result = await getKennismakingenByCandidateId(5);
    expect(result).toEqual([]);
  });
});

describe("getKennismakingById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });
    mockSelectLimit.mockResolvedValue([mockKennismaking]);
  });

  it("returns kennismaking when found", async () => {
    const result = await getKennismakingById(1);
    expect(result).toEqual(mockKennismaking);
  });

  it("returns null when not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await getKennismakingById(999);
    expect(result).toBeNull();
  });

  it("returns null on error", async () => {
    mockSelectLimit.mockRejectedValue(new Error("DB error"));
    const result = await getKennismakingById(1);
    expect(result).toBeNull();
  });
});
