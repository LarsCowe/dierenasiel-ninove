import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb, mockSelect, mockFrom, mockWhere, mockOrderBy, mockLimit, mockOffset, setMockData, mockEq, mockAnd } = vi.hoisted(() => {
  let mockData: unknown[] = [];
  const setMockData = (data: unknown[]) => { mockData = data; };

  // Drizzle queries are thenable — make each step awaitable
  const mockOffset = vi.fn(async () => mockData);
  const mockLimit = vi.fn(() => ({ offset: mockOffset, then: (res: (v: unknown) => void) => Promise.resolve(mockData).then(res) }));
  const mockOrderBy = vi.fn(() => ({ limit: mockLimit, offset: mockOffset, then: (res: (v: unknown) => void) => Promise.resolve(mockData).then(res) }));
  const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy, limit: mockLimit, then: (res: (v: unknown) => void) => Promise.resolve(mockData).then(res) }));
  const mockFrom = vi.fn(() => ({ where: mockWhere, orderBy: mockOrderBy }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));
  const mockDb = { select: mockSelect };
  const mockEq = vi.fn((...args: unknown[]) => ({ type: "eq", args }));
  const mockAnd = vi.fn((...args: unknown[]) => ({ type: "and", args }));
  return { mockDb, mockSelect, mockFrom, mockWhere, mockOrderBy, mockLimit, mockOffset, setMockData, mockEq, mockAnd };
});

vi.mock("@/lib/db", () => ({ db: mockDb }));

vi.mock("@/lib/db/schema", () => ({
  animals: {
    id: "animals.id",
    name: "animals.name",
    species: "animals.species",
    breed: "animals.breed",
    gender: "animals.gender",
    status: "animals.status",
    kennelId: "animals.kennel_id",
    workflowPhase: "animals.workflow_phase",
    intakeDate: "animals.intake_date",
    isInShelter: "animals.is_in_shelter",
    identificationNr: "animals.identification_nr",
    createdAt: "animals.created_at",
  },
  kennels: {
    id: "kennels.id",
    code: "kennels.code",
  },
  behaviorRecords: {
    id: "behavior_records.id",
    animalId: "behavior_records.animal_id",
    date: "behavior_records.date",
    checklist: "behavior_records.checklist",
    notes: "behavior_records.notes",
    createdAt: "behavior_records.created_at",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: mockEq,
  and: mockAnd,
  asc: vi.fn((col: unknown) => ({ type: "asc", col })),
  desc: vi.fn((col: unknown) => ({ type: "desc", col })),
  sql: vi.fn(),
}));

import { getAnimalReport, getBehaviorReportByAnimalId } from "./reports";

const mockAnimals = [
  { id: 1, name: "Rex", species: "hond", breed: "Labrador", gender: "reu", status: "beschikbaar", kennelId: 1, workflowPhase: "verblijf", intakeDate: "2025-12-01" },
  { id: 2, name: "Mimi", species: "kat", breed: "Europees", gender: "poes", status: "beschikbaar", kennelId: 2, workflowPhase: "medisch", intakeDate: "2026-01-10" },
  { id: 3, name: "Buddy", species: "hond", breed: "Herder", gender: "reu", status: "gereserveerd", kennelId: 1, workflowPhase: "adoptie", intakeDate: "2025-11-15" },
];

describe("getAnimalReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockData(mockAnimals);
    mockOffset.mockImplementation(async () => mockAnimals);
    mockOrderBy.mockReturnValue({ limit: mockLimit, offset: mockOffset, then: (res: (v: unknown) => void) => Promise.resolve(mockAnimals).then(res) });
    mockWhere.mockReturnValue({ orderBy: mockOrderBy, limit: mockLimit, then: (res: (v: unknown) => void) => Promise.resolve(mockAnimals).then(res) });
    mockLimit.mockReturnValue({ offset: mockOffset, then: (res: (v: unknown) => void) => Promise.resolve(mockAnimals).then(res) });
    mockFrom.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  it("returns all animals with no filters and default pagination", async () => {
    const result = await getAnimalReport({});

    expect(result.animals).toEqual(mockAnimals);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
  });

  it("applies species filter", async () => {
    await getAnimalReport({ species: "hond" });

    expect(mockWhere).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("animals.species", "hond");
  });

  it("applies status filter", async () => {
    await getAnimalReport({ status: "beschikbaar" });

    expect(mockWhere).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("animals.status", "beschikbaar");
  });

  it("applies kennelId filter", async () => {
    await getAnimalReport({ kennelId: 1 });

    expect(mockWhere).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("animals.kennel_id", 1);
  });

  it("applies workflowPhase filter", async () => {
    await getAnimalReport({ workflowPhase: "verblijf" });

    expect(mockWhere).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("animals.workflow_phase", "verblijf");
  });

  it("applies multiple filters simultaneously", async () => {
    await getAnimalReport({ species: "hond", status: "beschikbaar", workflowPhase: "verblijf" });

    expect(mockWhere).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("animals.species", "hond");
    expect(mockEq).toHaveBeenCalledWith("animals.status", "beschikbaar");
    expect(mockEq).toHaveBeenCalledWith("animals.workflow_phase", "verblijf");
    expect(mockAnd).toHaveBeenCalled();
  });

  it("uses pagination when page and pageSize are provided", async () => {
    await getAnimalReport({ page: 2, pageSize: 50 });

    expect(mockLimit).toHaveBeenCalledWith(50);
    expect(mockOffset).toHaveBeenCalledWith(50); // (page-1) * pageSize
  });

  it("returns all results when no pagination is provided (for export)", async () => {
    const result = await getAnimalReport({});

    expect(result.animals).toEqual(mockAnimals);
    expect(result.total).toBe(mockAnimals.length);
    // No limit/offset called when no pagination
    expect(mockLimit).not.toHaveBeenCalled();
    expect(mockOffset).not.toHaveBeenCalled();
  });

  it("returns empty array on database error", async () => {
    // Non-paginated path awaits orderBy directly (thenable)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockOrderBy.mockReturnValue({
      limit: mockLimit,
      offset: mockOffset,
      then: (_res: unknown, rej: (e: Error) => void) => Promise.reject(new Error("DB error")).catch(rej),
    } as any);

    const result = await getAnimalReport({});

    expect(result.animals).toEqual([]);
    expect(result.total).toBe(0);
  });
});

const mockBehaviorRecords = [
  { id: 1, animalId: 1, date: "2026-01-15", checklist: { benaderingHok: 4 }, notes: "Rustige hond", createdAt: new Date() },
  { id: 2, animalId: 1, date: "2026-02-01", checklist: { benaderingHok: 5 }, notes: null, createdAt: new Date() },
];

describe("getBehaviorReportByAnimalId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockOrderBy.mockReturnValue({ then: (res: (v: unknown) => void) => Promise.resolve(mockBehaviorRecords).then(res) } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockWhere.mockReturnValue({ orderBy: mockOrderBy } as any);
    mockFrom.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  it("returns behavior records for a given animal", async () => {
    const result = await getBehaviorReportByAnimalId(1);

    expect(result).toEqual(mockBehaviorRecords);
    expect(mockFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it("returns empty array on database error", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockOrderBy.mockReturnValue({ then: (_res: unknown, rej: (e: Error) => void) => Promise.reject(new Error("DB error")).catch(rej) } as any);

    const result = await getBehaviorReportByAnimalId(1);

    expect(result).toEqual([]);
  });
});
