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
    chain.innerJoin = vi.fn().mockReturnValue(chain);
    chain.where = vi.fn().mockReturnValue(chain);
    chain.orderBy = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockImplementation(() => resolve());
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
  vaccinations: {
    id: "vaccinations_id",
    animalId: "vaccinations_animal_id",
    type: "vaccinations_type",
    nextDueDate: "vaccinations_next_due_date",
  },
  medications: {
    id: "medications_id",
    animalId: "medications_animal_id",
    medicationName: "medications_medication_name",
    dosage: "medications_dosage",
    endDate: "medications_end_date",
    isActive: "medications_is_active",
  },
  animals: {
    id: "animals_id",
    name: "animals_name",
    isInShelter: "animals_is_in_shelter",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  asc: vi.fn((col: unknown) => ({ type: "asc", col })),
  isNotNull: vi.fn((col: unknown) => ({ type: "isNotNull", col })),
  sql: vi.fn(),
}));

import { getMedicalAlerts } from "./medical-alerts";
import { db } from "@/lib/db";

describe("getMedicalAlerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns vaccination alerts with nextDueDate within 7 days", async () => {
    const vaccAlerts = [
      { animalId: 1, animalName: "Rex", type: "rabiës", nextDueDate: "2026-02-27" },
    ];
    const medAlerts: unknown[] = [];
    mockResults.push(vaccAlerts, medAlerts);

    const result = await getMedicalAlerts();
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("vaccination");
    expect(result[0].animalName).toBe("Rex");
    expect(result[0].dueDate).toBe("2026-02-27");
  });

  it("returns medication alerts with endDate within 7 days", async () => {
    const vaccAlerts: unknown[] = [];
    const medAlerts = [
      { animalId: 2, animalName: "Milo", medicationName: "Metacam", dosage: "0.5mg", endDate: "2026-02-28" },
    ];
    mockResults.push(vaccAlerts, medAlerts);

    const result = await getMedicalAlerts();
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("medication");
    expect(result[0].animalName).toBe("Milo");
    expect(result[0].label).toContain("Metacam");
  });

  it("combines and sorts both categories by dueDate ascending", async () => {
    const vaccAlerts = [
      { animalId: 1, animalName: "Rex", type: "rabiës", nextDueDate: "2026-03-01" },
    ];
    const medAlerts = [
      { animalId: 2, animalName: "Milo", medicationName: "Metacam", dosage: "0.5mg", endDate: "2026-02-27" },
    ];
    mockResults.push(vaccAlerts, medAlerts);

    const result = await getMedicalAlerts();
    expect(result).toHaveLength(2);
    expect(result[0].dueDate).toBe("2026-02-27");
    expect(result[0].category).toBe("medication");
    expect(result[1].dueDate).toBe("2026-03-01");
    expect(result[1].category).toBe("vaccination");
  });

  it("returns empty array when no alerts", async () => {
    mockResults.push([], []);
    const result = await getMedicalAlerts();
    expect(result).toEqual([]);
  });

  it("respects limit parameter", async () => {
    const vaccAlerts = [
      { animalId: 1, animalName: "Rex", type: "rabiës", nextDueDate: "2026-02-27" },
      { animalId: 2, animalName: "Milo", type: "DHPP", nextDueDate: "2026-02-28" },
      { animalId: 3, animalName: "Luna", type: "FeLV", nextDueDate: "2026-03-01" },
    ];
    mockResults.push(vaccAlerts, []);

    const result = await getMedicalAlerts(2);
    expect(result).toHaveLength(2);
  });

  it("uses default limit of 15", async () => {
    const manyAlerts = Array.from({ length: 20 }, (_, i) => ({
      animalId: i + 1, animalName: `Dier${i + 1}`, type: "rabiës", nextDueDate: "2026-02-27",
    }));
    mockResults.push(manyAlerts, []);
    const result = await getMedicalAlerts();
    expect(result).toHaveLength(15);
  });

  it("returns empty array on vaccination query error", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });
    const result = await getMedicalAlerts();
    expect(result).toEqual([]);
  });

  it("returns empty array on medication query error", async () => {
    mockResults.push([]);
    vi.mocked(db.select)
      .mockImplementationOnce(() => {
        // First call (vaccinations) succeeds via chain
        const chain: Record<string, unknown> = {};
        const resolve = () => Promise.resolve(mockResults[0] ?? []);
        chain.from = vi.fn().mockReturnValue(chain);
        chain.innerJoin = vi.fn().mockReturnValue(chain);
        chain.where = vi.fn().mockReturnValue(chain);
        chain.orderBy = vi.fn().mockReturnValue(chain);
        chain.limit = vi.fn().mockImplementation(() => resolve());
        chain.then = vi.fn().mockImplementation((fn: (v: unknown) => unknown) => resolve().then(fn));
        return chain as unknown as ReturnType<typeof db.select>;
      })
      .mockImplementationOnce(() => {
        throw new Error("Connection refused");
      });
    const result = await getMedicalAlerts();
    expect(result).toEqual([]);
  });

  it("includes vaccination type in label", async () => {
    mockResults.push(
      [{ animalId: 1, animalName: "Rex", type: "rabiës", nextDueDate: "2026-02-27" }],
      [],
    );
    const result = await getMedicalAlerts();
    expect(result[0].label).toContain("rabiës");
  });

  it("includes medication name and dosage in label", async () => {
    mockResults.push(
      [],
      [{ animalId: 2, animalName: "Milo", medicationName: "Metacam", dosage: "0.5mg", endDate: "2026-02-28" }],
    );
    const result = await getMedicalAlerts();
    expect(result[0].label).toContain("Metacam");
    expect(result[0].label).toContain("0.5mg");
  });
});
