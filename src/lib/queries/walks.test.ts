import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockSelectWhere, mockSelectFrom, mockSelect,
  mockSelectLimit, mockSelectOrderBy,
  mockJoinOrderBy, mockJoinWhere, mockInnerJoin,
} = vi.hoisted(() => {
  const mockSelectOrderBy = vi.fn();
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ orderBy: mockSelectOrderBy, limit: mockSelectLimit });
  const mockJoinOrderBy = vi.fn();
  const mockJoinWhere = vi.fn().mockReturnValue({ orderBy: mockJoinOrderBy });
  const mockInnerJoin = vi.fn();
  mockInnerJoin.mockReturnValue({ innerJoin: mockInnerJoin, where: mockJoinWhere });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere, innerJoin: mockInnerJoin });
  const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });
  return {
    mockSelectWhere, mockSelectFrom, mockSelect,
    mockSelectLimit, mockSelectOrderBy,
    mockJoinOrderBy, mockJoinWhere, mockInnerJoin,
  };
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
    id: Symbol("walks.id"),
    walkerId: Symbol("walks.walkerId"),
    animalId: Symbol("walks.animalId"),
    date: Symbol("walks.date"),
    startTime: Symbol("walks.startTime"),
    status: Symbol("walks.status"),
  },
}));

import { getDogsAvailableForWalking, getWalkerByUserId, getWalksByWalkerId, getActiveWalksForAdmin } from "./walks";

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

describe("getActiveWalksForAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the join chain
    mockInnerJoin.mockReturnValue({ innerJoin: mockInnerJoin, where: mockJoinWhere });
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere, innerJoin: mockInnerJoin });
    mockSelect.mockReturnValue({ from: mockSelectFrom });
  });

  it("returns active walks with walker and animal info", async () => {
    const activeWalks = [
      {
        id: 1,
        walkerId: 10,
        animalId: 5,
        date: "2026-03-15",
        startTime: "10:00",
        status: "in_progress",
        walkerFirstName: "Jan",
        walkerLastName: "Janssens",
        walkerPhone: "0471234567",
        animalName: "Rex",
      },
    ];
    mockJoinOrderBy.mockResolvedValue(activeWalks);

    const result = await getActiveWalksForAdmin();

    expect(result).toEqual(activeWalks);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockInnerJoin).toHaveBeenCalledTimes(2);
  });

  it("returns empty array when no active walks", async () => {
    mockJoinOrderBy.mockResolvedValue([]);

    const result = await getActiveWalksForAdmin();

    expect(result).toEqual([]);
  });

  it("returns empty array on error", async () => {
    mockJoinWhere.mockReturnValue({
      orderBy: vi.fn().mockRejectedValue(new Error("DB error")),
    });

    const result = await getActiveWalksForAdmin();

    expect(result).toEqual([]);
  });
});
