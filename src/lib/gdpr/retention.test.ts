import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetExpiredCandidates,
  mockGetExpiredWalkers,
  mockGetFlaggedCandidates,
  mockGetFlaggedWalkers,
  mockUpdateWhere,
  mockUpdateSet,
  mockUpdate,
} = vi.hoisted(() => {
  const mockGetExpiredCandidates = vi.fn();
  const mockGetExpiredWalkers = vi.fn();
  const mockGetFlaggedCandidates = vi.fn();
  const mockGetFlaggedWalkers = vi.fn();

  // update chain: db.update().set().where()
  const mockUpdateWhere = vi.fn();
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

  return {
    mockGetExpiredCandidates,
    mockGetExpiredWalkers,
    mockGetFlaggedCandidates,
    mockGetFlaggedWalkers,
    mockUpdateWhere,
    mockUpdateSet,
    mockUpdate,
  };
});

vi.mock("@/lib/queries/gdpr", () => ({
  getExpiredCandidates: mockGetExpiredCandidates,
  getExpiredWalkers: mockGetExpiredWalkers,
  getFlaggedCandidates: mockGetFlaggedCandidates,
  getFlaggedWalkers: mockGetFlaggedWalkers,
}));

vi.mock("@/lib/db", () => ({
  db: {
    update: mockUpdate,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  adoptionCandidates: Symbol("adoptionCandidates"),
  walkers: Symbol("walkers"),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  inArray: vi.fn((...args: unknown[]) => ({ type: "inArray", args })),
}));

import {
  flagExpiredRecords,
  extendRetention,
  getRetentionSummary,
} from "./retention";

const mockExpiredCandidate = { id: 1, firstName: "Jan", lastName: "Janssens" };
const mockExpiredWalker = { id: 5, firstName: "Marie", lastName: "Peeters" };

describe("flagExpiredRecords", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("flags expired candidates and walkers", async () => {
    mockGetExpiredCandidates.mockResolvedValue([mockExpiredCandidate]);
    mockGetExpiredWalkers.mockResolvedValue([mockExpiredWalker]);

    const result = await flagExpiredRecords(1825);

    expect(result).toEqual({ candidates: 1, walkers: 1, candidateIds: [1], walkerIds: [5] });
    expect(mockGetExpiredCandidates).toHaveBeenCalledWith(1825);
    expect(mockGetExpiredWalkers).toHaveBeenCalledWith(1825);
    // Batch update: one call per table
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it("returns zero counts when no expired records", async () => {
    mockGetExpiredCandidates.mockResolvedValue([]);
    mockGetExpiredWalkers.mockResolvedValue([]);

    const result = await flagExpiredRecords(1825);

    expect(result).toEqual({ candidates: 0, walkers: 0, candidateIds: [], walkerIds: [] });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("handles multiple expired records per type", async () => {
    mockGetExpiredCandidates.mockResolvedValue([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);
    mockGetExpiredWalkers.mockResolvedValue([{ id: 10 }, { id: 11 }]);

    const result = await flagExpiredRecords(1825);

    expect(result).toEqual({ candidates: 3, walkers: 2, candidateIds: [1, 2, 3], walkerIds: [10, 11] });
    // Batch update: one call per table (not per record)
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });
});

describe("extendRetention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears flag and sets extension for a candidate", async () => {
    await extendRetention("candidate", 1, "Lopend adoptieverzoek");

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        retentionFlaggedAt: null,
        retentionExtensionReason: "Lopend adoptieverzoek",
      }),
    );
  });

  it("clears flag and sets extension for a walker", async () => {
    await extendRetention("walker", 5, "Actieve wandelaar");

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        retentionFlaggedAt: null,
        retentionExtensionReason: "Actieve wandelaar",
      }),
    );
  });

  it("sets retentionExtendedAt to a Date", async () => {
    await extendRetention("candidate", 1, "Reden");

    const setArg = mockUpdateSet.mock.calls[0][0];
    expect(setArg.retentionExtendedAt).toBeInstanceOf(Date);
  });
});

describe("getRetentionSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns counts of flagged records", async () => {
    mockGetFlaggedCandidates.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    mockGetFlaggedWalkers.mockResolvedValue([{ id: 5 }]);

    const result = await getRetentionSummary();

    expect(result).toEqual({
      flaggedCandidates: 2,
      flaggedWalkers: 1,
      totalFlagged: 3,
    });
  });

  it("returns zero counts when no flagged records", async () => {
    mockGetFlaggedCandidates.mockResolvedValue([]);
    mockGetFlaggedWalkers.mockResolvedValue([]);

    const result = await getRetentionSummary();

    expect(result).toEqual({
      flaggedCandidates: 0,
      flaggedWalkers: 0,
      totalFlagged: 0,
    });
  });
});
