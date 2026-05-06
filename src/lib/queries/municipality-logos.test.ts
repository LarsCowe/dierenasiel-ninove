import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockSelectLimit,
  mockSelectWhere,
  mockSelectWhereOrderBy,
  mockSelectOrderBy,
  mockSelectFrom,
} = vi.hoisted(() => {
  const mockSelectLimit = vi.fn();
  const mockSelectOrderBy = vi.fn();
  const mockSelectWhereOrderBy = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({
    limit: mockSelectLimit,
    orderBy: mockSelectWhereOrderBy,
  });
  const mockSelectFrom = vi.fn().mockReturnValue({
    where: mockSelectWhere,
    orderBy: mockSelectOrderBy,
  });
  return {
    mockSelectLimit,
    mockSelectWhere,
    mockSelectWhereOrderBy,
    mockSelectOrderBy,
    mockSelectFrom,
  };
});

vi.mock("@/lib/db", () => ({
  db: { select: vi.fn().mockReturnValue({ from: mockSelectFrom }) },
}));
vi.mock("@/lib/db/schema", () => ({
  municipalityLogos: {
    id: Symbol("municipalityLogos.id"),
    name: Symbol("municipalityLogos.name"),
    deletedAt: Symbol("municipalityLogos.deletedAt"),
  },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  asc: vi.fn((col: unknown) => ({ type: "asc", col })),
  isNull: vi.fn((col: unknown) => ({ type: "isNull", col })),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ type: "sql", strings, values })),
}));

import {
  getMunicipalityLogos,
  getAllMunicipalityLogosIncludingDeleted,
  getMunicipalityLogoById,
  getMunicipalityLogoByName,
} from "./municipality-logos";

const mockLogo = {
  id: 1,
  name: "Ninove",
  logoUrl: "https://blob.com/ninove.png",
  uploadedBy: "sven@asiel.be",
  uploadedAt: new Date(),
};

describe("getMunicipalityLogos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectWhereOrderBy.mockResolvedValue([mockLogo]);
  });

  it("returns active logos sorted by name asc, filtering out soft-deleted", async () => {
    const result = await getMunicipalityLogos();
    expect(result).toEqual([mockLogo]);
    expect(mockSelectWhere).toHaveBeenCalled();
    expect(mockSelectWhereOrderBy).toHaveBeenCalled();
  });

  it("returns [] on error", async () => {
    mockSelectWhereOrderBy.mockRejectedValue(new Error("DB error"));
    const result = await getMunicipalityLogos();
    expect(result).toEqual([]);
  });
});

describe("getAllMunicipalityLogosIncludingDeleted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectOrderBy.mockResolvedValue([mockLogo]);
  });

  it("returns logos including soft-deleted, sorted by name asc", async () => {
    const result = await getAllMunicipalityLogosIncludingDeleted();
    expect(result).toEqual([mockLogo]);
    expect(mockSelectWhere).not.toHaveBeenCalled();
    expect(mockSelectOrderBy).toHaveBeenCalled();
  });

  it("returns [] on error", async () => {
    mockSelectOrderBy.mockRejectedValue(new Error("DB error"));
    const result = await getAllMunicipalityLogosIncludingDeleted();
    expect(result).toEqual([]);
  });
});

describe("getMunicipalityLogoById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockLogo]);
  });

  it("returns logo when found", async () => {
    const result = await getMunicipalityLogoById(1);
    expect(result).toEqual(mockLogo);
  });

  it("returns null when not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await getMunicipalityLogoById(999);
    expect(result).toBeNull();
  });

  it("returns null on error", async () => {
    mockSelectLimit.mockRejectedValue(new Error("DB error"));
    const result = await getMunicipalityLogoById(1);
    expect(result).toBeNull();
  });
});

describe("getMunicipalityLogoByName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockLogo]);
  });

  it("matches case-insensitively", async () => {
    const result = await getMunicipalityLogoByName("ninove");
    expect(result).toEqual(mockLogo);
  });

  it("returns null when no match", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await getMunicipalityLogoByName("Onbekend");
    expect(result).toBeNull();
  });
});
