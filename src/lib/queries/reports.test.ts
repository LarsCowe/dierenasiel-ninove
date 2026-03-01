import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb, mockSelect, mockFrom, mockWhere, mockOrderBy, mockLimit, mockOffset, setMockData, mockEq, mockAnd, mockGte, mockLte, mockInnerJoin } = vi.hoisted(() => {
  let mockData: unknown[] = [];
  const setMockData = (data: unknown[]) => { mockData = data; };

  // Drizzle queries are thenable — make each step awaitable
  const mockOffset = vi.fn(async () => mockData);
  const mockLimit = vi.fn(() => ({ offset: mockOffset, then: (res: (v: unknown) => void) => Promise.resolve(mockData).then(res) }));
  const mockOrderBy = vi.fn(() => ({ limit: mockLimit, offset: mockOffset, then: (res: (v: unknown) => void) => Promise.resolve(mockData).then(res) }));
  const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy, limit: mockLimit, then: (res: (v: unknown) => void) => Promise.resolve(mockData).then(res) }));
  const mockInnerJoin = vi.fn(() => ({ where: mockWhere, orderBy: mockOrderBy, innerJoin: mockInnerJoin }));
  const mockFrom = vi.fn(() => ({ where: mockWhere, orderBy: mockOrderBy, innerJoin: mockInnerJoin }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));
  const mockDb = { select: mockSelect };
  const mockEq = vi.fn((...args: unknown[]) => ({ type: "eq", args }));
  const mockAnd = vi.fn((...args: unknown[]) => ({ type: "and", args }));
  const mockGte = vi.fn((...args: unknown[]) => ({ type: "gte", args }));
  const mockLte = vi.fn((...args: unknown[]) => ({ type: "lte", args }));
  return { mockDb, mockSelect, mockFrom, mockWhere, mockOrderBy, mockLimit, mockOffset, setMockData, mockEq, mockAnd, mockGte, mockLte, mockInnerJoin };
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
  vetVisits: {
    id: "vet_visits.id",
    animalId: "vet_visits.animal_id",
    date: "vet_visits.date",
    location: "vet_visits.location",
    complaints: "vet_visits.complaints",
    todo: "vet_visits.todo",
    isCompleted: "vet_visits.is_completed",
    completedAt: "vet_visits.completed_at",
    notes: "vet_visits.notes",
    createdAt: "vet_visits.created_at",
  },
  medications: {
    id: "medications.id",
    animalId: "medications.animal_id",
    medicationName: "medications.medication_name",
    dosage: "medications.dosage",
    startDate: "medications.start_date",
    endDate: "medications.end_date",
    isActive: "medications.is_active",
    notes: "medications.notes",
    createdAt: "medications.created_at",
  },
  medicationLogs: {
    id: "medication_logs.id",
    medicationId: "medication_logs.medication_id",
    administeredAt: "medication_logs.administered_at",
    administeredBy: "medication_logs.administered_by",
  },
  vetInspectionReports: {
    id: "vet_inspection_reports.id",
    visitDate: "vet_inspection_reports.visit_date",
    vetName: "vet_inspection_reports.vet_name",
    vetSignature: "vet_inspection_reports.vet_signature",
    animalsTreated: "vet_inspection_reports.animals_treated",
    animalsEuthanized: "vet_inspection_reports.animals_euthanized",
    abnormalBehavior: "vet_inspection_reports.abnormal_behavior",
    recommendations: "vet_inspection_reports.recommendations",
    createdAt: "vet_inspection_reports.created_at",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: mockEq,
  and: mockAnd,
  gte: mockGte,
  lte: mockLte,
  asc: vi.fn((col: unknown) => ({ type: "asc", col })),
  desc: vi.fn((col: unknown) => ({ type: "desc", col })),
  sql: vi.fn(),
}));

import { getAnimalReport, getBehaviorReportByAnimalId, getVetVisitsReport, getMedicationReport, getVetInspectionReportsFiltered } from "./reports";

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
    mockFrom.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy, innerJoin: mockInnerJoin });
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
    mockFrom.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy, innerJoin: mockInnerJoin });
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

// ==================== R2: Vet Visits Report ====================

const mockVetVisitRows = [
  { id: 1, animalId: 1, animalName: "Rex", animalSpecies: "hond", date: "2026-02-10", location: "in_asiel", complaints: null, todo: "Vaccinatie", isCompleted: false, completedAt: null, notes: null },
  { id: 2, animalId: 2, animalName: "Mimi", animalSpecies: "kat", date: "2026-02-15", location: "in_praktijk", complaints: "Kreupel", todo: "Röntgen", isCompleted: true, completedAt: new Date(), notes: "OK" },
];

describe("getVetVisitsReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockData(mockVetVisitRows);
    mockOffset.mockImplementation(async () => mockVetVisitRows);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockOrderBy.mockReturnValue({ limit: mockLimit, offset: mockOffset, then: (res: (v: unknown) => void) => Promise.resolve(mockVetVisitRows).then(res) } as any);
    mockWhere.mockReturnValue({ orderBy: mockOrderBy, limit: mockLimit, then: (res: (v: unknown) => void) => Promise.resolve(mockVetVisitRows).then(res) });
    mockLimit.mockReturnValue({ offset: mockOffset, then: (res: (v: unknown) => void) => Promise.resolve(mockVetVisitRows).then(res) });
    mockInnerJoin.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy, innerJoin: mockInnerJoin });
    mockFrom.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy, innerJoin: mockInnerJoin });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  it("returns all vet visits with no filters", async () => {
    const result = await getVetVisitsReport({});

    expect(result.visits).toEqual(mockVetVisitRows);
    expect(result.total).toBe(mockVetVisitRows.length);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
    expect(mockInnerJoin).toHaveBeenCalled();
  });

  it("applies dateFrom filter", async () => {
    await getVetVisitsReport({ dateFrom: "2026-02-01" });

    expect(mockWhere).toHaveBeenCalled();
    expect(mockGte).toHaveBeenCalledWith("vet_visits.date", "2026-02-01");
  });

  it("applies dateTo filter", async () => {
    await getVetVisitsReport({ dateTo: "2026-02-28" });

    expect(mockWhere).toHaveBeenCalled();
    expect(mockLte).toHaveBeenCalledWith("vet_visits.date", "2026-02-28");
  });

  it("applies location filter", async () => {
    await getVetVisitsReport({ location: "in_asiel" });

    expect(mockWhere).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("vet_visits.location", "in_asiel");
  });

  it("applies multiple filters simultaneously", async () => {
    await getVetVisitsReport({ dateFrom: "2026-02-01", dateTo: "2026-02-28", location: "in_praktijk" });

    expect(mockWhere).toHaveBeenCalled();
    expect(mockGte).toHaveBeenCalledWith("vet_visits.date", "2026-02-01");
    expect(mockLte).toHaveBeenCalledWith("vet_visits.date", "2026-02-28");
    expect(mockEq).toHaveBeenCalledWith("vet_visits.location", "in_praktijk");
    expect(mockAnd).toHaveBeenCalled();
  });

  it("uses pagination when page and pageSize are provided", async () => {
    await getVetVisitsReport({ page: 2, pageSize: 50 });

    expect(mockLimit).toHaveBeenCalledWith(50);
    expect(mockOffset).toHaveBeenCalledWith(50);
  });

  it("returns empty array on database error", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockOrderBy.mockReturnValue({
      limit: mockLimit,
      offset: mockOffset,
      then: (_res: unknown, rej: (e: Error) => void) => Promise.reject(new Error("DB error")).catch(rej),
    } as any);

    const result = await getVetVisitsReport({});

    expect(result.visits).toEqual([]);
    expect(result.total).toBe(0);
  });
});

// ==================== R5: Medication Report ====================

const mockMedicationRows = [
  { id: 1, animalId: 1, animalName: "Rex", animalSpecies: "hond", medicationName: "Amoxicilline", dosage: "250mg 2x/dag", startDate: "2026-02-01", endDate: null, isActive: true, notes: null },
  { id: 2, animalId: 2, animalName: "Mimi", animalSpecies: "kat", medicationName: "Metacam", dosage: "0.5ml 1x/dag", startDate: "2026-01-15", endDate: "2026-02-15", isActive: false, notes: "Afgerond" },
];

describe("getMedicationReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockData(mockMedicationRows);
    mockOffset.mockImplementation(async () => mockMedicationRows);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockOrderBy.mockReturnValue({ limit: mockLimit, offset: mockOffset, then: (res: (v: unknown) => void) => Promise.resolve(mockMedicationRows).then(res) } as any);
    mockWhere.mockReturnValue({ orderBy: mockOrderBy, limit: mockLimit, then: (res: (v: unknown) => void) => Promise.resolve(mockMedicationRows).then(res) });
    mockLimit.mockReturnValue({ offset: mockOffset, then: (res: (v: unknown) => void) => Promise.resolve(mockMedicationRows).then(res) });
    mockInnerJoin.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy, innerJoin: mockInnerJoin });
    mockFrom.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy, innerJoin: mockInnerJoin });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  it("returns all medications with no filters", async () => {
    const result = await getMedicationReport({});

    expect(result.medications).toEqual(mockMedicationRows);
    expect(result.total).toBe(mockMedicationRows.length);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockInnerJoin).toHaveBeenCalled();
  });

  it("filters by isActive = true (actief)", async () => {
    await getMedicationReport({ isActive: true });

    expect(mockWhere).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("medications.is_active", true);
  });

  it("filters by isActive = false (afgerond)", async () => {
    await getMedicationReport({ isActive: false });

    expect(mockWhere).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("medications.is_active", false);
  });

  it("uses pagination when page and pageSize are provided", async () => {
    await getMedicationReport({ page: 1, pageSize: 50 });

    expect(mockLimit).toHaveBeenCalledWith(50);
    expect(mockOffset).toHaveBeenCalledWith(0);
  });

  it("returns empty array on database error", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockOrderBy.mockReturnValue({
      limit: mockLimit,
      offset: mockOffset,
      then: (_res: unknown, rej: (e: Error) => void) => Promise.reject(new Error("DB error")).catch(rej),
    } as any);

    const result = await getMedicationReport({});

    expect(result.medications).toEqual([]);
    expect(result.total).toBe(0);
  });
});

// ==================== R11: Vet Inspection Reports (filtered) ====================

const mockInspectionReports = [
  { id: 1, visitDate: "2026-02-07", vetName: "Dr. Janssen", vetSignature: true, animalsTreated: [], animalsEuthanized: [], abnormalBehavior: [], recommendations: "Alles OK", createdAt: new Date() },
  { id: 2, visitDate: "2026-02-14", vetName: "Dr. Janssen", vetSignature: true, animalsTreated: [{ animalName: "Rex" }], animalsEuthanized: [], abnormalBehavior: [], recommendations: null, createdAt: new Date() },
];

describe("getVetInspectionReportsFiltered", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockData(mockInspectionReports);
    mockOffset.mockImplementation(async () => mockInspectionReports);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockOrderBy.mockReturnValue({ limit: mockLimit, offset: mockOffset, then: (res: (v: unknown) => void) => Promise.resolve(mockInspectionReports).then(res) } as any);
    mockWhere.mockReturnValue({ orderBy: mockOrderBy, limit: mockLimit, then: (res: (v: unknown) => void) => Promise.resolve(mockInspectionReports).then(res) });
    mockLimit.mockReturnValue({ offset: mockOffset, then: (res: (v: unknown) => void) => Promise.resolve(mockInspectionReports).then(res) });
    mockFrom.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy, innerJoin: mockInnerJoin });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  it("returns all reports with no filters", async () => {
    const result = await getVetInspectionReportsFiltered({});

    expect(result.reports).toEqual(mockInspectionReports);
    expect(result.total).toBe(mockInspectionReports.length);
    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
  });

  it("applies dateFrom filter", async () => {
    await getVetInspectionReportsFiltered({ dateFrom: "2026-01-01" });

    expect(mockWhere).toHaveBeenCalled();
    expect(mockGte).toHaveBeenCalledWith("vet_inspection_reports.visit_date", "2026-01-01");
  });

  it("applies dateTo filter", async () => {
    await getVetInspectionReportsFiltered({ dateTo: "2026-02-28" });

    expect(mockWhere).toHaveBeenCalled();
    expect(mockLte).toHaveBeenCalledWith("vet_inspection_reports.visit_date", "2026-02-28");
  });

  it("applies both date filters simultaneously", async () => {
    await getVetInspectionReportsFiltered({ dateFrom: "2024-03-01", dateTo: "2026-02-28" });

    expect(mockWhere).toHaveBeenCalled();
    expect(mockGte).toHaveBeenCalledWith("vet_inspection_reports.visit_date", "2024-03-01");
    expect(mockLte).toHaveBeenCalledWith("vet_inspection_reports.visit_date", "2026-02-28");
    expect(mockAnd).toHaveBeenCalled();
  });

  it("uses pagination when page and pageSize are provided", async () => {
    await getVetInspectionReportsFiltered({ page: 3, pageSize: 50 });

    expect(mockLimit).toHaveBeenCalledWith(50);
    expect(mockOffset).toHaveBeenCalledWith(100); // (3-1) * 50
  });

  it("returns empty array on database error", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockOrderBy.mockReturnValue({
      limit: mockLimit,
      offset: mockOffset,
      then: (_res: unknown, rej: (e: Error) => void) => Promise.reject(new Error("DB error")).catch(rej),
    } as any);

    const result = await getVetInspectionReportsFiltered({});

    expect(result.reports).toEqual([]);
    expect(result.total).toBe(0);
  });
});
