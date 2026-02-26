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
  neglectReports: {
    animalId: "animal_id",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));

import { getNeglectReportByAnimalId, hasNeglectReport } from "./neglect-reports";
import { db } from "@/lib/db";

describe("getNeglectReportByAnimalId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns report when found", async () => {
    const report = {
      id: 1,
      animalId: 42,
      healthStatusOnArrival: "Ondervoed",
      neglectFindings: "Geen voer",
      createdAt: "2026-02-26",
    };
    mockResults.push([report]);

    const result = await getNeglectReportByAnimalId(42);

    expect(result).toEqual(report);
  });

  it("returns null when no report exists", async () => {
    mockResults.push([]);

    const result = await getNeglectReportByAnimalId(999);

    expect(result).toBeNull();
  });

  it("returns null on database error (graceful fallback)", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });

    const result = await getNeglectReportByAnimalId(1);

    expect(result).toBeNull();
  });
});

describe("hasNeglectReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns true when report exists", async () => {
    mockResults.push([{ id: 1 }]);

    const result = await hasNeglectReport(42);

    expect(result).toBe(true);
  });

  it("returns false when no report exists", async () => {
    mockResults.push([]);

    const result = await hasNeglectReport(999);

    expect(result).toBe(false);
  });

  it("returns false on database error (graceful fallback)", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });

    const result = await hasNeglectReport(1);

    expect(result).toBe(false);
  });
});
