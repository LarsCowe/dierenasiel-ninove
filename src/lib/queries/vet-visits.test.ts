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
  vetVisits: { animalId: "animal_id", date: "date" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  desc: vi.fn((col: unknown) => ({ type: "desc", col })),
}));

import { getVetVisitsByAnimalId } from "./vet-visits";
import { db } from "@/lib/db";

describe("getVetVisitsByAnimalId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns vet visits when found", async () => {
    const records = [
      { id: 1, animalId: 42, date: "2026-02-26", location: "in_asiel" },
      { id: 2, animalId: 42, date: "2026-01-15", location: "in_praktijk" },
    ];
    mockResults.push(records);

    const result = await getVetVisitsByAnimalId(42);
    expect(result).toEqual(records);
  });

  it("returns empty array when no vet visits exist", async () => {
    mockResults.push([]);
    const result = await getVetVisitsByAnimalId(999);
    expect(result).toEqual([]);
  });

  it("returns empty array on database error", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });
    const result = await getVetVisitsByAnimalId(1);
    expect(result).toEqual([]);
  });
});
