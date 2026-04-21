import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockSelectWhere, mockSelectFrom, mockSelect,
  mockSelectOrderBy, mockSelectOffset, mockSelectLimit,
  mockSelectDistinctFrom, mockSelectDistinct,
} = vi.hoisted(() => {
  const mockSelectOffset = vi.fn();
  const mockSelectLimit = vi.fn().mockReturnValue({ offset: mockSelectOffset });
  const mockSelectOrderBy = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectWhere = vi.fn().mockReturnValue({ orderBy: mockSelectOrderBy });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere, orderBy: mockSelectOrderBy });
  const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });
  const mockSelectDistinctFrom = vi.fn();
  const mockSelectDistinct = vi.fn().mockReturnValue({ from: mockSelectDistinctFrom });
  return {
    mockSelectWhere, mockSelectFrom, mockSelect,
    mockSelectOrderBy, mockSelectOffset, mockSelectLimit,
    mockSelectDistinctFrom, mockSelectDistinct,
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    select: mockSelect,
    selectDistinct: mockSelectDistinct,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  strayCatCampaigns: {
    id: Symbol("strayCatCampaigns.id"),
    status: Symbol("strayCatCampaigns.status"),
    municipality: Symbol("strayCatCampaigns.municipality"),
    requestDate: Symbol("strayCatCampaigns.requestDate"),
    linkedAnimalId: Symbol("strayCatCampaigns.linkedAnimalId"),
  },
  animals: {
    id: Symbol("animals.id"),
    name: Symbol("animals.name"),
    species: Symbol("animals.species"),
    isInShelter: Symbol("animals.isInShelter"),
  },
}));

vi.mock("@/lib/constants", () => ({
  CAMPAIGN_STATUSES: ["open", "kooien_geplaatst", "in_behandeling", "afgerond"],
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  desc: vi.fn((col: unknown) => ({ type: "desc", col })),
  gte: vi.fn((...args: unknown[]) => ({ type: "gte", args })),
  lte: vi.fn((...args: unknown[]) => ({ type: "lte", args })),
  ne: vi.fn((...args: unknown[]) => ({ type: "ne", args })),
  isNotNull: vi.fn((col: unknown) => ({ type: "isNotNull", col })),
  sql: Object.assign(vi.fn(), { raw: vi.fn() }),
}));

import {
  getCampaignById,
  getAllCampaigns,
  getCatsAvailableForLinking,
  getCampaignsForAdmin,
  getDistinctMunicipalities,
  getCampaignReport,
  getOccupiedCageNumbers,
} from "./stray-cat-campaigns";

describe("getCampaignById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a campaign when found", async () => {
    const mockCampaign = { id: 1, municipality: "Ninove", status: "open" };
    mockSelectWhere.mockResolvedValue([mockCampaign]);

    const result = await getCampaignById(1);

    expect(result).toEqual(mockCampaign);
    expect(mockSelect).toHaveBeenCalled();
  });

  it("returns null when not found", async () => {
    mockSelectWhere.mockResolvedValue([]);

    const result = await getCampaignById(999);

    expect(result).toBeNull();
  });
});

describe("getAllCampaigns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all campaigns ordered by requestDate desc", async () => {
    const mockCampaigns = [
      { id: 2, municipality: "Geraardsbergen" },
      { id: 1, municipality: "Ninove" },
    ];
    mockSelectOrderBy.mockResolvedValue(mockCampaigns);

    const result = await getAllCampaigns();

    expect(result).toEqual(mockCampaigns);
    expect(mockSelect).toHaveBeenCalled();
  });

  it("returns empty array when no campaigns", async () => {
    mockSelectOrderBy.mockResolvedValue([]);

    const result = await getAllCampaigns();

    expect(result).toEqual([]);
  });
});

describe("getCatsAvailableForLinking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns cats in shelter", async () => {
    const mockCats = [
      { id: 10, name: "Minou" },
      { id: 11, name: "Felix" },
    ];
    mockSelectWhere.mockResolvedValue(mockCats);

    const result = await getCatsAvailableForLinking();

    expect(result).toEqual(mockCats);
    expect(mockSelect).toHaveBeenCalled();
  });

  it("returns empty array when no cats available", async () => {
    mockSelectWhere.mockResolvedValue([]);

    const result = await getCatsAvailableForLinking();

    expect(result).toEqual([]);
  });
});

describe("getCampaignsForAdmin", () => {
  function setupMocks(data: unknown[] = [{ id: 1, municipality: "Ninove" }], count = 5) {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount % 2 === 1) {
        // Data query: select → from → where → orderBy → limit → offset
        const offset = vi.fn().mockResolvedValue(data);
        const limit = vi.fn().mockReturnValue({ offset });
        const orderBy = vi.fn().mockReturnValue({ limit });
        const where = vi.fn().mockReturnValue({ orderBy });
        const from = vi.fn().mockReturnValue({ where, orderBy });
        return { from };
      } else {
        // Count query: select → from → where
        const where = vi.fn().mockResolvedValue([{ count }]);
        const from = vi.fn().mockReturnValue({ where });
        return { from };
      }
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  it("returns campaigns and total with default pagination", async () => {
    const result = await getCampaignsForAdmin();

    expect(result.campaigns).toEqual([{ id: 1, municipality: "Ninove" }]);
    expect(result.total).toBe(5);
    expect(mockSelect).toHaveBeenCalledTimes(2);
  });

  it("applies municipality filter with correct value", async () => {
    await getCampaignsForAdmin({ municipality: "Ninove" });

    const { eq } = await import("drizzle-orm");
    expect(eq).toHaveBeenCalledWith(expect.anything(), "Ninove");
  });

  it("applies status filter with correct value", async () => {
    await getCampaignsForAdmin({ status: "open" });

    const { eq } = await import("drizzle-orm");
    expect(eq).toHaveBeenCalledWith(expect.anything(), "open");
  });

  it("ignores invalid status values", async () => {
    await getCampaignsForAdmin({ status: "INVALID_STATUS" });

    const { eq } = await import("drizzle-orm");
    // eq should NOT be called for status (only no calls with "INVALID_STATUS")
    const statusCalls = (eq as ReturnType<typeof vi.fn>).mock.calls.filter(
      (call: unknown[]) => call[1] === "INVALID_STATUS",
    );
    expect(statusCalls).toHaveLength(0);
  });

  it("applies dateFrom filter with correct value", async () => {
    await getCampaignsForAdmin({ dateFrom: "2026-01-01" });

    const { gte } = await import("drizzle-orm");
    expect(gte).toHaveBeenCalledWith(expect.anything(), "2026-01-01");
  });

  it("ignores invalid dateFrom values", async () => {
    await getCampaignsForAdmin({ dateFrom: "not-a-date" });

    const { gte } = await import("drizzle-orm");
    expect(gte).not.toHaveBeenCalled();
  });

  it("applies dateTo filter with correct value", async () => {
    await getCampaignsForAdmin({ dateTo: "2026-12-31" });

    const { lte } = await import("drizzle-orm");
    expect(lte).toHaveBeenCalledWith(expect.anything(), "2026-12-31");
  });

  it("ignores invalid dateTo values", async () => {
    await getCampaignsForAdmin({ dateTo: "2026-13-45" });

    const { lte } = await import("drizzle-orm");
    expect(lte).not.toHaveBeenCalled();
  });

  it("combines multiple filters", async () => {
    await getCampaignsForAdmin({
      municipality: "Ninove",
      status: "open",
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
    });

    const { and } = await import("drizzle-orm");
    expect(and).toHaveBeenCalled();
  });

  it("returns empty result on error", async () => {
    mockSelect.mockImplementation(() => {
      throw new Error("DB error");
    });

    const result = await getCampaignsForAdmin();

    expect(result).toEqual({ campaigns: [], total: 0 });
  });

  it("returns empty campaigns when no data", async () => {
    setupMocks([], 0);

    const result = await getCampaignsForAdmin();

    expect(result.campaigns).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe("getDistinctMunicipalities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns sorted list of unique municipalities", async () => {
    const mockOrderBy = vi.fn().mockResolvedValue([
      { municipality: "Geraardsbergen" },
      { municipality: "Ninove" },
    ]);
    mockSelectDistinctFrom.mockReturnValue({ orderBy: mockOrderBy });

    const result = await getDistinctMunicipalities();

    expect(result).toEqual(["Geraardsbergen", "Ninove"]);
    expect(mockSelectDistinct).toHaveBeenCalled();
  });

  it("returns empty array on error", async () => {
    mockSelectDistinct.mockImplementation(() => {
      throw new Error("DB error");
    });

    const result = await getDistinctMunicipalities();

    expect(result).toEqual([]);
  });
});

describe("getCampaignReport", () => {
  const mockCampaigns = [
    { id: 1, municipality: "Ninove", status: "afgerond", fivStatus: "positief", felvStatus: "negatief", outcome: "gecastreerd_uitgezet" },
    { id: 2, municipality: "Ninove", status: "afgerond", fivStatus: "negatief", felvStatus: "positief", outcome: "gesteriliseerd_uitgezet" },
    { id: 3, municipality: "Geraardsbergen", status: "afgerond", fivStatus: "negatief", felvStatus: "negatief", outcome: "geadopteerd" },
    { id: 4, municipality: "Ninove", status: "open", fivStatus: null, felvStatus: null, outcome: null },
  ];

  function setupReportMock(data: unknown[] = mockCampaigns) {
    // getCampaignReport uses select → from → where → orderBy (no limit/offset)
    const orderBy = vi.fn().mockResolvedValue(data);
    const where = vi.fn().mockReturnValue({ orderBy });
    const from = vi.fn().mockReturnValue({ where, orderBy });
    mockSelect.mockReturnValue({ from });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    setupReportMock();
  });

  it("returns campaigns and calculated stats", async () => {
    const result = await getCampaignReport();

    expect(result.campaigns).toHaveLength(4);
    expect(result.stats.total).toBe(4);
  });

  it("calculates correct FIV positive percentage based on tested campaigns", async () => {
    const result = await getCampaignReport();

    // 1 positief out of 3 tested (id=4 has null fivStatus)
    expect(result.stats.fivPositive).toBe(1);
    expect(result.stats.fivTested).toBe(3);
    expect(result.stats.fivPercentage).toBe(33);
  });

  it("calculates correct FeLV positive percentage based on tested campaigns", async () => {
    const result = await getCampaignReport();

    // 1 positief out of 3 tested (id=4 has null felvStatus)
    expect(result.stats.felvPositive).toBe(1);
    expect(result.stats.felvTested).toBe(3);
    expect(result.stats.felvPercentage).toBe(33);
  });

  it("counts outcomes correctly", async () => {
    const result = await getCampaignReport();

    expect(result.stats.outcomes).toEqual({
      gecastreerd_uitgezet: 1,
      gesteriliseerd_uitgezet: 1,
      geadopteerd: 1,
    });
  });

  it("counts completed campaigns (afgerond status)", async () => {
    const result = await getCampaignReport();

    // 3 out of 4 campaigns have status "afgerond"
    expect(result.stats.completedCampaigns).toBe(3);
  });

  it("returns empty stats when no campaigns", async () => {
    setupReportMock([]);

    const result = await getCampaignReport();

    expect(result.campaigns).toEqual([]);
    expect(result.stats).toEqual({
      total: 0,
      completedCampaigns: 0,
      fivPositive: 0,
      fivTested: 0,
      fivPercentage: 0,
      felvPositive: 0,
      felvTested: 0,
      felvPercentage: 0,
      outcomes: {},
    });
  });

  it("applies municipality filter", async () => {
    await getCampaignReport({ municipality: "Ninove" });

    const { eq } = await import("drizzle-orm");
    expect(eq).toHaveBeenCalledWith(expect.anything(), "Ninove");
  });

  it("applies dateFrom filter", async () => {
    await getCampaignReport({ dateFrom: "2026-01-01" });

    const { gte } = await import("drizzle-orm");
    expect(gte).toHaveBeenCalledWith(expect.anything(), "2026-01-01");
  });

  it("applies dateTo filter", async () => {
    await getCampaignReport({ dateTo: "2026-12-31" });

    const { lte } = await import("drizzle-orm");
    expect(lte).toHaveBeenCalledWith(expect.anything(), "2026-12-31");
  });

  it("ignores invalid date filters", async () => {
    await getCampaignReport({ dateFrom: "not-a-date", dateTo: "2026-13-45" });

    const { gte, lte } = await import("drizzle-orm");
    expect(gte).not.toHaveBeenCalled();
    expect(lte).not.toHaveBeenCalled();
  });

  it("returns empty result on error", async () => {
    mockSelect.mockImplementation(() => {
      throw new Error("DB error");
    });

    const result = await getCampaignReport();

    expect(result.campaigns).toEqual([]);
    expect(result.stats.total).toBe(0);
  });
});

describe("getOccupiedCageNumbers (Story 10.7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Vorige describe ("getCampaignReport") overschrijft mockSelect met een throw.
    // Reset naar de default select→from→where chain voor deze tests.
    mockSelect.mockReturnValue({ from: mockSelectFrom });
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere, orderBy: mockSelectOrderBy });
  });

  it("returns empty map when geen active campagnes met kooinummers", async () => {
    mockSelectWhere.mockResolvedValueOnce([]);
    const result = await getOccupiedCageNumbers();
    expect(result).toEqual({});
  });

  it("parset komma-gescheiden kooinummers met trim", async () => {
    mockSelectWhere.mockResolvedValueOnce([
      { id: 7, cageNumbers: "K1, K2 ,K3" },
    ]);
    const result = await getOccupiedCageNumbers();
    expect(result).toEqual({ K1: 7, K2: 7, K3: 7 });
  });

  it("mergt kooinummers over meerdere actieve campagnes", async () => {
    mockSelectWhere.mockResolvedValueOnce([
      { id: 1, cageNumbers: "K1,K2" },
      { id: 2, cageNumbers: "K5" },
    ]);
    const result = await getOccupiedCageNumbers();
    expect(result).toEqual({ K1: 1, K2: 1, K5: 2 });
  });

  it("skipt rijen met null cageNumbers", async () => {
    mockSelectWhere.mockResolvedValueOnce([
      { id: 1, cageNumbers: null },
      { id: 2, cageNumbers: "K7" },
    ]);
    const result = await getOccupiedCageNumbers();
    expect(result).toEqual({ K7: 2 });
  });
});

describe("getActiveStrayCatCampaigns (Story 10.8)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chain (getCampaignReport test overschrijft mockSelect met throw).
    mockSelect.mockReturnValue({ from: mockSelectFrom });
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere, orderBy: mockSelectOrderBy });
    mockSelectWhere.mockReturnValue({ orderBy: mockSelectOrderBy });
    mockSelectOrderBy.mockReturnValue({ limit: mockSelectLimit });
  });

  it("retourneert lijst van actieve campagnes", async () => {
    const mockData = [
      { id: 3, municipality: "Halle", status: "kooien_geplaatst", requestDate: "2026-04-20" },
      { id: 2, municipality: "Gooik", status: "in_behandeling", requestDate: "2026-04-15" },
    ];
    mockSelectLimit.mockResolvedValueOnce(mockData);

    const { getActiveStrayCatCampaigns } = await import("./stray-cat-campaigns");
    const result = await getActiveStrayCatCampaigns(10);

    expect(result).toEqual(mockData);
  });

  it("retourneert lege array bij DB-fout", async () => {
    mockSelect.mockImplementationOnce(() => {
      throw new Error("DB down");
    });

    const { getActiveStrayCatCampaigns } = await import("./stray-cat-campaigns");
    const result = await getActiveStrayCatCampaigns(10);

    expect(result).toEqual([]);
  });

  it("retourneert lege array wanneer geen actieve campagnes", async () => {
    mockSelectLimit.mockResolvedValueOnce([]);

    const { getActiveStrayCatCampaigns } = await import("./stray-cat-campaigns");
    const result = await getActiveStrayCatCampaigns(5);

    expect(result).toEqual([]);
  });
});
