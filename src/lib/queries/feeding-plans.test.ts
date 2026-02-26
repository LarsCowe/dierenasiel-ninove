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
  feedingPlans: {
    animalId: "animal_id",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));

import { getFeedingPlanByAnimalId } from "./feeding-plans";
import { db } from "@/lib/db";

describe("getFeedingPlanByAnimalId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns feeding plan when found", async () => {
    const plan = {
      id: 1,
      animalId: 42,
      questionnaire: { dieetType: "droogvoer", hoeveelheid: "200g", frequentie: "2x/dag" },
      notes: null,
      updatedAt: "2026-02-26",
    };
    mockResults.push([plan]);

    const result = await getFeedingPlanByAnimalId(42);

    expect(result).toEqual(plan);
  });

  it("returns null when no feeding plan exists", async () => {
    mockResults.push([]);

    const result = await getFeedingPlanByAnimalId(999);

    expect(result).toBeNull();
  });

  it("returns null on database error (graceful fallback)", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });

    const result = await getFeedingPlanByAnimalId(1);

    expect(result).toBeNull();
  });
});
