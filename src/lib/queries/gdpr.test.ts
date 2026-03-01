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
  kennismakingen: Symbol("kennismakingen"),
  adoptionContracts: Symbol("adoptionContracts"),
  postAdoptionFollowups: Symbol("postAdoptionFollowups"),
  walks: Symbol("walks"),
  animals: Symbol("animals"),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  or: vi.fn((...args: unknown[]) => ({ type: "or", args })),
  ilike: vi.fn((...args: unknown[]) => ({ type: "ilike", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  isNull: vi.fn((...args: unknown[]) => ({ type: "isNull", args })),
  isNotNull: vi.fn((...args: unknown[]) => ({ type: "isNotNull", args })),
  lt: vi.fn((...args: unknown[]) => ({ type: "lt", args })),
}));

import {
  searchCandidatesForGdpr,
  searchWalkersForGdpr,
  getAdoptionCandidateForGdpr,
  getWalkerForGdpr,
  getKennismakingenForExport,
  getContractsForExport,
  getFollowupsForExport,
  getWalksForExport,
  getAnimalNameById,
  getExpiredCandidates,
  getExpiredWalkers,
  getFlaggedCandidates,
  getFlaggedWalkers,
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

// === Export query helpers ===

const mockKennismaking = {
  id: 10,
  adoptionCandidateId: 1,
  animalId: 3,
  scheduledAt: new Date("2026-01-15"),
  location: "Asiel",
  status: "completed",
  outcome: "positief",
  notes: "Goede klik",
  createdBy: "admin",
  createdAt: new Date("2026-01-10"),
};

const mockContract = {
  id: 20,
  animalId: 3,
  candidateId: 1,
  contractDate: "2026-02-01",
  paymentAmount: "150.00",
  paymentMethod: "payconiq",
  contractPdfUrl: null,
  dogidCatidTransferDeadline: "2026-02-15",
  dogidCatidTransferred: true,
  notes: null,
  createdAt: new Date("2026-02-01"),
};

const mockFollowup = {
  id: 30,
  contractId: 20,
  followupType: "1_week",
  date: "2026-02-08",
  notes: "Alles goed",
  status: "completed",
  createdAt: new Date("2026-02-08"),
};

const mockWalk = {
  id: 40,
  walkerId: 5,
  animalId: 3,
  date: "2026-01-20",
  startTime: "10:00",
  endTime: "10:45",
  durationMinutes: 45,
  remarks: "Brave hond",
  status: "completed",
  createdAt: new Date("2026-01-20"),
};

describe("getKennismakingenForExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockKennismaking]);
  });

  it("returns kennismakingen for a candidate", async () => {
    const result = await getKennismakingenForExport(1);

    expect(result).toEqual([mockKennismaking]);
    expect(mockSelectFrom).toHaveBeenCalled();
    expect(mockSelectWhere).toHaveBeenCalled();
  });

  it("returns empty array when no kennismakingen found", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await getKennismakingenForExport(999);

    expect(result).toEqual([]);
  });
});

describe("getContractsForExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockContract]);
  });

  it("returns contracts for a candidate", async () => {
    const result = await getContractsForExport(1);

    expect(result).toEqual([mockContract]);
    expect(mockSelectFrom).toHaveBeenCalled();
    expect(mockSelectWhere).toHaveBeenCalled();
  });

  it("returns empty array when no contracts found", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await getContractsForExport(999);

    expect(result).toEqual([]);
  });
});

describe("getFollowupsForExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockFollowup]);
  });

  it("returns followups for a contract", async () => {
    const result = await getFollowupsForExport(20);

    expect(result).toEqual([mockFollowup]);
    expect(mockSelectFrom).toHaveBeenCalled();
    expect(mockSelectWhere).toHaveBeenCalled();
  });

  it("returns empty array when no followups found", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await getFollowupsForExport(999);

    expect(result).toEqual([]);
  });
});

describe("getWalksForExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockWalk]);
  });

  it("returns walks for a walker", async () => {
    const result = await getWalksForExport(5);

    expect(result).toEqual([mockWalk]);
    expect(mockSelectFrom).toHaveBeenCalled();
    expect(mockSelectWhere).toHaveBeenCalled();
  });

  it("returns empty array when no walks found", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await getWalksForExport(999);

    expect(result).toEqual([]);
  });
});

describe("getAnimalNameById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([{ name: "Max" }]);
  });

  it("returns animal name by id", async () => {
    const result = await getAnimalNameById(3);

    expect(result).toBe("Max");
  });

  it("returns null when animal not found", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await getAnimalNameById(999);

    expect(result).toBeNull();
  });
});

// === Retention query tests ===

describe("getExpiredCandidates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockCandidate]);
  });

  it("returns candidates past retention period", async () => {
    const result = await getExpiredCandidates(1825);

    expect(result).toEqual([mockCandidate]);
    expect(mockSelectFrom).toHaveBeenCalled();
    expect(mockSelectWhere).toHaveBeenCalled();
  });

  it("returns empty array when no expired candidates", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await getExpiredCandidates(1825);

    expect(result).toEqual([]);
  });
});

describe("getExpiredWalkers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockWalker]);
  });

  it("returns walkers past retention period", async () => {
    const result = await getExpiredWalkers(1825);

    expect(result).toEqual([mockWalker]);
    expect(mockSelectFrom).toHaveBeenCalled();
    expect(mockSelectWhere).toHaveBeenCalled();
  });

  it("returns empty array when no expired walkers", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await getExpiredWalkers(1825);

    expect(result).toEqual([]);
  });
});

describe("getFlaggedCandidates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([{ ...mockCandidate, retentionFlaggedAt: new Date() }]);
  });

  it("returns flagged candidates", async () => {
    const result = await getFlaggedCandidates();

    expect(result).toHaveLength(1);
    expect(mockSelectFrom).toHaveBeenCalled();
    expect(mockSelectWhere).toHaveBeenCalled();
  });

  it("returns empty array when no flagged candidates", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await getFlaggedCandidates();

    expect(result).toEqual([]);
  });
});

describe("getFlaggedWalkers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([{ ...mockWalker, retentionFlaggedAt: new Date() }]);
  });

  it("returns flagged walkers", async () => {
    const result = await getFlaggedWalkers();

    expect(result).toHaveLength(1);
    expect(mockSelectFrom).toHaveBeenCalled();
    expect(mockSelectWhere).toHaveBeenCalled();
  });

  it("returns empty array when no flagged walkers", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await getFlaggedWalkers();

    expect(result).toEqual([]);
  });
});
