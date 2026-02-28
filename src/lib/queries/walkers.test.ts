import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockSelectLimit, mockSelectWhere, mockSelectOrderBy, mockSelectFrom,
} = vi.hoisted(() => {
  const mockSelectLimit = vi.fn();
  const mockSelectOrderBy = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectWhere = vi.fn().mockReturnValue({ orderBy: mockSelectOrderBy, limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere, orderBy: mockSelectOrderBy });
  return { mockSelectLimit, mockSelectOrderBy, mockSelectWhere, mockSelectFrom };
});

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  walkers: {
    id: Symbol("walkers.id"),
    status: Symbol("walkers.status"),
    email: Symbol("walkers.email"),
    createdAt: Symbol("walkers.createdAt"),
    walkCount: Symbol("walkers.walkCount"),
    isWalkingClubMember: Symbol("walkers.isWalkingClubMember"),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  desc: vi.fn((col: unknown) => ({ type: "desc", col })),
  gte: vi.fn((...args: unknown[]) => ({ type: "gte", args })),
  lt: vi.fn((...args: unknown[]) => ({ type: "lt", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  sql: vi.fn(),
}));

import { getWalkersForAdmin, getWalkerById, getWalkingClubMembers, getNearThresholdWalkers } from "./walkers";

const mockWalker = {
  id: 1,
  firstName: "Jan",
  lastName: "Janssens",
  email: "jan@example.com",
  phone: "0471234567",
  dateOfBirth: "2000-01-15",
  address: "Kerkstraat 1",
  allergies: null,
  childrenWalkAlong: false,
  regulationsRead: true,
  barcode: "WLK-1",
  photoUrl: null,
  isApproved: false,
  walkCount: 0,
  isWalkingClubMember: false,
  status: "pending",
  rejectionReason: null,
  createdAt: new Date(),
};

describe("getWalkersForAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockWalker]);
    mockSelectOrderBy.mockReturnValue({ limit: mockSelectLimit });
    mockSelectWhere.mockReturnValue({ orderBy: mockSelectOrderBy, limit: mockSelectLimit });
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere, orderBy: mockSelectOrderBy });
  });

  it("returns walkers list", async () => {
    const result = await getWalkersForAdmin();
    expect(result).toEqual([mockWalker]);
  });

  it("limits to 50 results", async () => {
    await getWalkersForAdmin();
    expect(mockSelectLimit).toHaveBeenCalledWith(50);
  });

  it("filters by status when provided", async () => {
    await getWalkersForAdmin("pending");
    expect(mockSelectWhere).toHaveBeenCalled();
  });

  it("returns all walkers when no filter", async () => {
    const result = await getWalkersForAdmin();
    expect(result).toEqual([mockWalker]);
  });

  it("returns empty array on error", async () => {
    mockSelectLimit.mockRejectedValue(new Error("DB error"));
    const result = await getWalkersForAdmin();
    expect(result).toEqual([]);
  });
});

describe("getWalkerById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockWalker]);
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });
  });

  it("returns walker when found", async () => {
    const result = await getWalkerById(1);
    expect(result).toEqual(mockWalker);
  });

  it("returns null when not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await getWalkerById(999);
    expect(result).toBeNull();
  });

  it("returns null on error", async () => {
    mockSelectLimit.mockRejectedValue(new Error("DB error"));
    const result = await getWalkerById(1);
    expect(result).toBeNull();
  });
});

const mockClubMember = {
  ...mockWalker,
  id: 2,
  firstName: "Marie",
  lastName: "Peeters",
  walkCount: 15,
  isWalkingClubMember: true,
  status: "approved",
};

describe("getWalkingClubMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectOrderBy.mockReturnValue({ limit: mockSelectLimit });
    mockSelectWhere.mockReturnValue({ orderBy: mockSelectOrderBy });
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
    mockSelectLimit.mockResolvedValue([mockClubMember]);
  });

  it("returns walking club members", async () => {
    const result = await getWalkingClubMembers();
    expect(result).toEqual([mockClubMember]);
  });

  it("returns empty array on error", async () => {
    mockSelectLimit.mockRejectedValue(new Error("DB error"));
    const result = await getWalkingClubMembers();
    expect(result).toEqual([]);
  });
});

describe("getNearThresholdWalkers", () => {
  const nearWalker = { ...mockWalker, walkCount: 8, status: "approved" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectOrderBy.mockReturnValue({ limit: mockSelectLimit });
    mockSelectWhere.mockReturnValue({ orderBy: mockSelectOrderBy });
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
    mockSelectLimit.mockResolvedValue([nearWalker]);
  });

  it("returns walkers near threshold", async () => {
    const result = await getNearThresholdWalkers(10);
    expect(result).toEqual([nearWalker]);
  });

  it("returns empty array on error", async () => {
    mockSelectLimit.mockRejectedValue(new Error("DB error"));
    const result = await getNearThresholdWalkers(10);
    expect(result).toEqual([]);
  });
});
