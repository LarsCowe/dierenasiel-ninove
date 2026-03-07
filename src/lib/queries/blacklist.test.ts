import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSelect, mockFrom, mockWhere, mockOrderBy } = vi.hoisted(() => {
  const mockOrderBy = vi.fn().mockResolvedValue([]);
  const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere, orderBy: mockOrderBy });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  return { mockSelect, mockFrom, mockWhere, mockOrderBy };
});

vi.mock("@/lib/db", () => ({
  db: { select: mockSelect },
}));

vi.mock("@/lib/db/schema", () => ({
  blacklistEntries: Symbol("blacklistEntries"),
}));

import { getAllBlacklistEntries, getActiveBlacklistEntries, checkBlacklistMatch } from "./blacklist";

describe("getAllBlacklistEntries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all entries ordered by createdAt desc", async () => {
    const entries = [
      { id: 1, firstName: "Jan", lastName: "Peeters", isActive: true },
      { id: 2, firstName: "Marie", lastName: "Janssens", isActive: false },
    ];
    mockOrderBy.mockResolvedValue(entries);

    const result = await getAllBlacklistEntries();
    expect(result).toEqual(entries);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
  });
});

describe("getActiveBlacklistEntries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only active entries", async () => {
    const entries = [{ id: 1, firstName: "Jan", lastName: "Peeters", isActive: true }];
    mockOrderBy.mockResolvedValue(entries);

    const result = await getActiveBlacklistEntries();
    expect(result).toEqual(entries);
    expect(mockWhere).toHaveBeenCalled();
  });
});

describe("checkBlacklistMatch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when no active entries exist", async () => {
    mockOrderBy.mockResolvedValue([]);

    const result = await checkBlacklistMatch("Jan", "Peeters", "Kerkstraat 12");
    expect(result).toBeNull();
  });

  it("returns matching entry on exact name match (case-insensitive)", async () => {
    const entry = { id: 1, firstName: "Jan", lastName: "Peeters", address: null, isActive: true };
    mockOrderBy.mockResolvedValue([entry]);

    const result = await checkBlacklistMatch("jan", "peeters", null);
    expect(result).toEqual(entry);
  });

  it("returns matching entry on address match (case-insensitive)", async () => {
    const entry = { id: 1, firstName: "X", lastName: "Y", address: "Kerkstraat 12, Ninove", isActive: true };
    mockOrderBy.mockResolvedValue([entry]);

    const result = await checkBlacklistMatch("Anders", "Naam", "kerkstraat 12, ninove");
    expect(result).toEqual(entry);
  });

  it("returns null when no match", async () => {
    const entry = { id: 1, firstName: "Jan", lastName: "Peeters", address: "Kerkstraat 12", isActive: true };
    mockOrderBy.mockResolvedValue([entry]);

    const result = await checkBlacklistMatch("Marie", "Janssens", "Andere straat");
    expect(result).toBeNull();
  });

  it("trims whitespace before comparing", async () => {
    const entry = { id: 1, firstName: "Jan", lastName: "Peeters", address: null, isActive: true };
    mockOrderBy.mockResolvedValue([entry]);

    const result = await checkBlacklistMatch("  Jan  ", "  Peeters  ", null);
    expect(result).toEqual(entry);
  });

  it("returns null when address is null on both sides", async () => {
    const entry = { id: 1, firstName: "X", lastName: "Y", address: null, isActive: true };
    mockOrderBy.mockResolvedValue([entry]);

    const result = await checkBlacklistMatch("Anders", "Naam", null);
    expect(result).toBeNull();
  });
});
