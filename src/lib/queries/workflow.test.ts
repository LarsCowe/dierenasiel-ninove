import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockSelectOrderBy, mockSelectWhere, mockSelectFrom, mockSelectLimit,
} = vi.hoisted(() => {
  const mockSelectOrderBy = vi.fn();
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ orderBy: mockSelectOrderBy });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  return { mockSelectOrderBy, mockSelectWhere, mockSelectFrom, mockSelectLimit };
});

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  animalWorkflowHistory: {
    animalId: Symbol("animalWorkflowHistory.animalId"),
    createdAt: Symbol("animalWorkflowHistory.createdAt"),
  },
  animals: {
    id: Symbol("animals.id"),
    species: Symbol("animals.species"),
    identificationNr: Symbol("animals.identificationNr"),
    isNeutered: Symbol("animals.isNeutered"),
    workflowPhase: Symbol("animals.workflowPhase"),
  },
  vaccinations: {
    id: Symbol("vaccinations.id"),
    animalId: Symbol("vaccinations.animalId"),
  },
  adoptionContracts: {
    id: Symbol("adoptionContracts.id"),
    animalId: Symbol("adoptionContracts.animalId"),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  desc: vi.fn((col: unknown) => ({ type: "desc", col })),
}));

import { getWorkflowHistoryByAnimalId, getCurrentPhase, getAnimalGuardContext } from "./workflow";

describe("getWorkflowHistoryByAnimalId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
    mockSelectWhere.mockReturnValue({ orderBy: mockSelectOrderBy });
  });

  it("returns history records for given animalId", async () => {
    const mockHistory = [
      { id: 1, animalId: 5, fromPhase: "intake", toPhase: "registratie", changedBy: 1, createdAt: new Date() },
      { id: 2, animalId: 5, fromPhase: "registratie", toPhase: "medisch", changedBy: 1, createdAt: new Date() },
    ];
    mockSelectOrderBy.mockResolvedValue(mockHistory);

    const result = await getWorkflowHistoryByAnimalId(5);
    expect(result).toEqual(mockHistory);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no history exists", async () => {
    mockSelectOrderBy.mockResolvedValue([]);

    const result = await getWorkflowHistoryByAnimalId(999);
    expect(result).toEqual([]);
  });

  it("returns empty array on database error", async () => {
    mockSelectOrderBy.mockRejectedValue(new Error("DB error"));

    const result = await getWorkflowHistoryByAnimalId(5);
    expect(result).toEqual([]);
  });
});

describe("getCurrentPhase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
  });

  it("returns current workflow phase for an animal", async () => {
    const mockSelectLimit = vi.fn().mockResolvedValue([{ workflowPhase: "medisch" }]);
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });

    const result = await getCurrentPhase(5);
    expect(result).toBe("medisch");
  });

  it("returns null when animal not found", async () => {
    const mockSelectLimit = vi.fn().mockResolvedValue([]);
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });

    const result = await getCurrentPhase(999);
    expect(result).toBeNull();
  });

  it("returns null on database error", async () => {
    const mockSelectLimit = vi.fn().mockRejectedValue(new Error("DB error"));
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });

    const result = await getCurrentPhase(5);
    expect(result).toBeNull();
  });
});

describe("getAnimalGuardContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });
  });

  it("returns guard context for existing animal with no vaccinations or contracts", async () => {
    mockSelectLimit
      .mockResolvedValueOnce([{ id: 5, species: "kat", identificationNr: null, isNeutered: false }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await getAnimalGuardContext(5);
    expect(result).toEqual({
      animal: { id: 5, species: "kat", identificationNr: null, isNeutered: false },
      hasVaccinations: false,
      hasAdoptionContract: false,
    });
  });

  it("returns guard context with hasVaccinations and hasAdoptionContract true", async () => {
    mockSelectLimit
      .mockResolvedValueOnce([{ id: 5, species: "hond", identificationNr: "BE-123", isNeutered: true }])
      .mockResolvedValueOnce([{ id: 10 }])
      .mockResolvedValueOnce([{ id: 20 }]);

    const result = await getAnimalGuardContext(5);
    expect(result).toEqual({
      animal: { id: 5, species: "hond", identificationNr: "BE-123", isNeutered: true },
      hasVaccinations: true,
      hasAdoptionContract: true,
    });
  });

  it("returns null when animal not found", async () => {
    mockSelectLimit.mockResolvedValueOnce([]);

    const result = await getAnimalGuardContext(999);
    expect(result).toBeNull();
  });

  it("returns null on database error", async () => {
    mockSelectLimit.mockRejectedValueOnce(new Error("DB error"));

    const result = await getAnimalGuardContext(5);
    expect(result).toBeNull();
  });
});
