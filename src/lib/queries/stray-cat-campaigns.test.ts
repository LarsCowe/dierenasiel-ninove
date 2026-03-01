import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockSelectWhere, mockSelectFrom, mockSelect,
  mockSelectOrderBy,
} = vi.hoisted(() => {
  const mockSelectOrderBy = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ orderBy: mockSelectOrderBy });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere, orderBy: mockSelectOrderBy });
  const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });
  return { mockSelectWhere, mockSelectFrom, mockSelect, mockSelectOrderBy };
});

vi.mock("@/lib/db", () => ({
  db: {
    select: mockSelect,
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

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  desc: vi.fn((col: unknown) => ({ type: "desc", col })),
}));

import {
  getCampaignById,
  getAllCampaigns,
  getCatsAvailableForLinking,
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
