import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockSelectOrderBy, mockSelectWhere, mockSelectFrom, mockSelectLimit, mockLeftJoin,
} = vi.hoisted(() => {
  const mockSelectOrderBy = vi.fn();
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ orderBy: mockSelectOrderBy });
  const mockLeftJoin = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere, leftJoin: mockLeftJoin });
  return { mockSelectOrderBy, mockSelectWhere, mockSelectFrom, mockSelectLimit, mockLeftJoin };
});

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  animalWorkflowHistory: {
    id: Symbol("animalWorkflowHistory.id"),
    animalId: Symbol("animalWorkflowHistory.animalId"),
    fromPhase: Symbol("animalWorkflowHistory.fromPhase"),
    toPhase: Symbol("animalWorkflowHistory.toPhase"),
    changedBy: Symbol("animalWorkflowHistory.changedBy"),
    changeReason: Symbol("animalWorkflowHistory.changeReason"),
    autoActionsTriggered: Symbol("animalWorkflowHistory.autoActionsTriggered"),
    createdAt: Symbol("animalWorkflowHistory.createdAt"),
  },
  animals: {
    id: Symbol("animals.id"),
    species: Symbol("animals.species"),
    identificationNr: Symbol("animals.identificationNr"),
    isNeutered: Symbol("animals.isNeutered"),
    workflowPhase: Symbol("animals.workflowPhase"),
  },
  users: {
    id: Symbol("users.id"),
    name: Symbol("users.name"),
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

import { getWorkflowHistoryByAnimalId, getWorkflowHistoryWithUserByAnimalId, getCurrentPhase, getAnimalGuardContext } from "./workflow";

describe("getWorkflowHistoryWithUserByAnimalId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectFrom.mockReturnValue({ leftJoin: mockLeftJoin });
    mockLeftJoin.mockReturnValue({ where: mockSelectWhere });
    mockSelectWhere.mockReturnValue({ orderBy: mockSelectOrderBy });
  });

  it("returns entries with changedByName from user join", async () => {
    const mockEntries = [
      { id: 1, animalId: 5, fromPhase: "intake", toPhase: "registratie", changedBy: 1, changeReason: null, autoActionsTriggered: null, createdAt: new Date(), changedByName: "Johan" },
      { id: 2, animalId: 5, fromPhase: "registratie", toPhase: "medisch", changedBy: 2, changeReason: null, autoActionsTriggered: null, createdAt: new Date(), changedByName: "Anna" },
    ];
    mockSelectOrderBy.mockResolvedValue(mockEntries);

    const result = await getWorkflowHistoryWithUserByAnimalId(5);
    expect(result).toEqual(mockEntries);
    expect(result).toHaveLength(2);
    expect(result[0].changedByName).toBe("Johan");
    expect(result[1].changedByName).toBe("Anna");
  });

  it("returns changedByName as null when user is deleted (leftJoin)", async () => {
    const mockEntries = [
      { id: 1, animalId: 5, fromPhase: "intake", toPhase: "registratie", changedBy: 99, changeReason: null, autoActionsTriggered: null, createdAt: new Date(), changedByName: null },
    ];
    mockSelectOrderBy.mockResolvedValue(mockEntries);

    const result = await getWorkflowHistoryWithUserByAnimalId(5);
    expect(result).toHaveLength(1);
    expect(result[0].changedByName).toBeNull();
  });

  it("returns empty array for animal without history", async () => {
    mockSelectOrderBy.mockResolvedValue([]);

    const result = await getWorkflowHistoryWithUserByAnimalId(999);
    expect(result).toEqual([]);
  });

  it("returns entries sorted by createdAt descending (newest first)", async () => {
    const older = new Date("2026-02-26");
    const newer = new Date("2026-03-01");
    const mockEntries = [
      { id: 2, animalId: 5, fromPhase: "registratie", toPhase: "medisch", changedBy: 1, changeReason: null, autoActionsTriggered: null, createdAt: newer, changedByName: "Johan" },
      { id: 1, animalId: 5, fromPhase: "intake", toPhase: "registratie", changedBy: 1, changeReason: null, autoActionsTriggered: null, createdAt: older, changedByName: "Johan" },
    ];
    mockSelectOrderBy.mockResolvedValue(mockEntries);

    const result = await getWorkflowHistoryWithUserByAnimalId(5);
    expect(result[0].createdAt.getTime()).toBeGreaterThan(result[1].createdAt.getTime());
  });

  it("returns empty array on database error", async () => {
    mockSelectOrderBy.mockRejectedValue(new Error("DB error"));

    const result = await getWorkflowHistoryWithUserByAnimalId(5);
    expect(result).toEqual([]);
  });
});

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
