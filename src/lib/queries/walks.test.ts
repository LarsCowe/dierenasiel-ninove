import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockSelectWhere, mockSelectFrom, mockSelect,
  mockSelectLimit, mockSelectOrderBy,
} = vi.hoisted(() => {
  const mockSelectOrderBy = vi.fn();
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ orderBy: mockSelectOrderBy, limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });
  return { mockSelectWhere, mockSelectFrom, mockSelect, mockSelectLimit, mockSelectOrderBy };
});

vi.mock("@/lib/db", () => ({
  db: {
    select: mockSelect,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  animals: {
    species: Symbol("animals.species"),
    isInShelter: Symbol("animals.isInShelter"),
    name: Symbol("animals.name"),
  },
  walkers: {
    userId: Symbol("walkers.userId"),
    id: Symbol("walkers.id"),
  },
  walks: {
    walkerId: Symbol("walks.walkerId"),
    date: Symbol("walks.date"),
  },
}));

import { getDogsAvailableForWalking, getWalkerByUserId, getWalksByWalkerId } from "./walks";

describe("getDogsAvailableForWalking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns dogs that are in shelter", async () => {
    const dogs = [
      { id: 1, name: "Rex", species: "hond", isInShelter: true },
      { id: 2, name: "Buddy", species: "hond", isInShelter: true },
    ];
    mockSelectOrderBy.mockResolvedValue(dogs);
    mockSelectWhere.mockReturnValue({ orderBy: mockSelectOrderBy });

    const result = await getDogsAvailableForWalking();

    expect(result).toEqual(dogs);
    expect(mockSelect).toHaveBeenCalled();
  });

  it("returns empty array on error", async () => {
    mockSelectWhere.mockReturnValue({
      orderBy: vi.fn().mockRejectedValue(new Error("DB error")),
    });

    const result = await getDogsAvailableForWalking();

    expect(result).toEqual([]);
  });
});

describe("getWalkerByUserId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns walker when found", async () => {
    const walker = { id: 1, userId: 99, firstName: "Jan" };
    mockSelectLimit.mockResolvedValue([walker]);
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });

    const result = await getWalkerByUserId(99);

    expect(result).toEqual(walker);
  });

  it("returns null when not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });

    const result = await getWalkerByUserId(999);

    expect(result).toBeNull();
  });

  it("returns null on error", async () => {
    mockSelectWhere.mockReturnValue({
      limit: vi.fn().mockRejectedValue(new Error("DB error")),
    });

    const result = await getWalkerByUserId(99);

    expect(result).toBeNull();
  });
});

describe("getWalksByWalkerId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns walks ordered by date desc", async () => {
    const walks = [
      { id: 2, walkerId: 1, date: "2026-03-20" },
      { id: 1, walkerId: 1, date: "2026-03-15" },
    ];
    mockSelectOrderBy.mockResolvedValue(walks);
    mockSelectWhere.mockReturnValue({ orderBy: mockSelectOrderBy });

    const result = await getWalksByWalkerId(1);

    expect(result).toEqual(walks);
  });

  it("returns empty array on error", async () => {
    mockSelectWhere.mockReturnValue({
      orderBy: vi.fn().mockRejectedValue(new Error("DB error")),
    });

    const result = await getWalksByWalkerId(1);

    expect(result).toEqual([]);
  });
});
