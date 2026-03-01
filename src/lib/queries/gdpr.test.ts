import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockSelectLimit,
  mockSelectWhere,
  mockSelectFrom,
  mockSelectOrderBy,
} = vi.hoisted(() => {
  const mockSelectLimit = vi.fn();
  const mockSelectOrderBy = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectWhere = vi.fn().mockReturnValue({ orderBy: mockSelectOrderBy, limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere, orderBy: mockSelectOrderBy });

  return {
    mockSelectLimit,
    mockSelectWhere,
    mockSelectFrom,
    mockSelectOrderBy,
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  adoptionCandidates: Symbol("adoptionCandidates"),
  walkers: Symbol("walkers"),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  or: vi.fn((...args: unknown[]) => ({ type: "or", args })),
  ilike: vi.fn((...args: unknown[]) => ({ type: "ilike", args })),
}));

import {
  searchCandidatesForGdpr,
  searchWalkersForGdpr,
  getAdoptionCandidateForGdpr,
  getWalkerForGdpr,
} from "./gdpr";
import { ilike } from "drizzle-orm";

const mockCandidate = {
  id: 1,
  firstName: "Jan",
  lastName: "Janssens",
  email: "jan@example.com",
  phone: "0471234567",
  address: "Kerkstraat 1",
  anonymisedAt: null,
};

const mockWalker = {
  id: 5,
  firstName: "Marie",
  lastName: "Peeters",
  email: "marie@example.com",
  phone: "0498765432",
  address: "Brusselsesteenweg 10",
  anonymisedAt: null,
};

describe("searchCandidatesForGdpr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockCandidate]);
  });

  it("returns matching candidates by search query", async () => {
    const result = await searchCandidatesForGdpr("jan");

    expect(result).toEqual([mockCandidate]);
    expect(mockSelectFrom).toHaveBeenCalled();
    expect(mockSelectWhere).toHaveBeenCalled();
  });

  it("returns empty array when no matches found", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await searchCandidatesForGdpr("nobody");

    expect(result).toEqual([]);
  });

  it("escapes ILIKE wildcards in search query", async () => {
    await searchCandidatesForGdpr("100%_test");

    // ilike should be called with escaped pattern
    const calls = vi.mocked(ilike).mock.calls;
    const patterns = calls.map((c) => c[1]);
    // Every call should use the escaped pattern
    for (const p of patterns) {
      expect(p).toBe("%100\\%\\_test%");
    }
  });
});

describe("searchWalkersForGdpr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockWalker]);
  });

  it("returns matching walkers by search query", async () => {
    const result = await searchWalkersForGdpr("marie");

    expect(result).toEqual([mockWalker]);
    expect(mockSelectFrom).toHaveBeenCalled();
    expect(mockSelectWhere).toHaveBeenCalled();
  });

  it("returns empty array when no matches found", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await searchWalkersForGdpr("nobody");

    expect(result).toEqual([]);
  });
});

describe("getAdoptionCandidateForGdpr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockCandidate]);
  });

  it("returns full candidate record by id", async () => {
    const result = await getAdoptionCandidateForGdpr(1);

    expect(result).toEqual(mockCandidate);
    expect(mockSelectWhere).toHaveBeenCalled();
  });

  it("returns null when candidate not found", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await getAdoptionCandidateForGdpr(999);

    expect(result).toBeNull();
  });
});

describe("getWalkerForGdpr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockWalker]);
  });

  it("returns full walker record by id", async () => {
    const result = await getWalkerForGdpr(5);

    expect(result).toEqual(mockWalker);
    expect(mockSelectWhere).toHaveBeenCalled();
  });

  it("returns null when walker not found", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await getWalkerForGdpr(999);

    expect(result).toBeNull();
  });
});
