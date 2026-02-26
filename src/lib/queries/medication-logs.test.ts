import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockResults } = vi.hoisted(() => {
  const mockResults: unknown[][] = [];
  return { mockResults };
});

vi.mock("@/lib/db", () => {
  let callIndex = 0;
  const createChain = () => {
    const chain: Record<string, unknown> = {};
    const resolve = () => {
      const result = mockResults[callIndex] ?? [];
      callIndex++;
      return Promise.resolve(result);
    };
    chain.from = vi.fn().mockReturnValue(chain);
    chain.where = vi.fn().mockReturnValue(chain);
    chain.innerJoin = vi.fn().mockReturnValue(chain);
    chain.orderBy = vi.fn().mockImplementation(() => resolve());
    chain.then = vi.fn().mockImplementation((fn: (v: unknown) => unknown) => resolve().then(fn));
    return chain;
  };
  return {
    db: {
      select: vi.fn().mockImplementation(() => createChain()),
      _resetIndex: () => { callIndex = 0; },
    },
  };
});

vi.mock("@/lib/db/schema", () => ({
  medicationLogs: {
    medicationId: "medication_id",
    administeredAt: "administered_at",
  },
  medications: {
    id: "id",
    animalId: "animal_id",
    isActive: "is_active",
  },
  animals: {
    id: "animals_id",
    name: "name",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  desc: vi.fn((col: unknown) => ({ type: "desc", col })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  gte: vi.fn((...args: unknown[]) => ({ type: "gte", args })),
  lt: vi.fn((...args: unknown[]) => ({ type: "lt", args })),
  inArray: vi.fn((...args: unknown[]) => ({ type: "inArray", args })),
}));
vi.mock("@/lib/utils/date", () => ({
  getBelgianDayBounds: vi.fn(() => ({
    start: new Date("2026-02-26T00:00:00Z"),
    end: new Date("2026-02-27T00:00:00Z"),
  })),
}));

import { getMedicationLogsByMedicationId, getActiveMedicationsWithTodayStatus, getTodayMedicationLogsByAnimalId } from "./medication-logs";
import { db } from "@/lib/db";

describe("getMedicationLogsByMedicationId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns logs when found", async () => {
    const records = [
      { id: 1, medicationId: 5, administeredAt: new Date(), administeredBy: "Jan" },
      { id: 2, medicationId: 5, administeredAt: new Date(), administeredBy: "Piet" },
    ];
    mockResults.push(records);

    const result = await getMedicationLogsByMedicationId(5);
    expect(result).toEqual(records);
  });

  it("returns empty array when no logs exist", async () => {
    mockResults.push([]);
    const result = await getMedicationLogsByMedicationId(999);
    expect(result).toEqual([]);
  });

  it("returns empty array on database error", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });
    const result = await getMedicationLogsByMedicationId(1);
    expect(result).toEqual([]);
  });
});

describe("getActiveMedicationsWithTodayStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns medications with today status", async () => {
    const activeMeds = [
      {
        medication: { id: 1, medicationName: "Amoxicilline", dosage: "2x daags", animalId: 10 },
        animal: { id: 10, name: "Rex", species: "hond" },
      },
    ];
    const todayLogs = [
      { id: 100, medicationId: 1, administeredAt: new Date(), administeredBy: "Jan" },
    ];
    mockResults.push(activeMeds);
    mockResults.push(todayLogs);

    const result = await getActiveMedicationsWithTodayStatus();
    expect(result).toHaveLength(1);
    expect(result[0].medication.id).toBe(1);
    expect(result[0].todayLog).not.toBeNull();
  });

  it("returns empty array when no active medications", async () => {
    mockResults.push([]);
    mockResults.push([]);
    const result = await getActiveMedicationsWithTodayStatus();
    expect(result).toEqual([]);
  });

  it("returns empty array on database error", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });
    const result = await getActiveMedicationsWithTodayStatus();
    expect(result).toEqual([]);
  });
});

describe("getTodayMedicationLogsByAnimalId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns today's logs for an animal", async () => {
    const medicationIds = [{ id: 1 }, { id: 2 }];
    const todayLogs = [
      { id: 10, medicationId: 1, administeredAt: new Date(), administeredBy: "Jan" },
    ];
    mockResults.push(medicationIds);
    mockResults.push(todayLogs);

    const result = await getTodayMedicationLogsByAnimalId(42);
    expect(result).toEqual(todayLogs);
  });

  it("returns empty array when animal has no medications", async () => {
    mockResults.push([]);
    const result = await getTodayMedicationLogsByAnimalId(999);
    expect(result).toEqual([]);
  });

  it("returns empty array on database error", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });
    const result = await getTodayMedicationLogsByAnimalId(1);
    expect(result).toEqual([]);
  });
});
