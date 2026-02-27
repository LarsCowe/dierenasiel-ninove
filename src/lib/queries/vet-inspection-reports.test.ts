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
  vetInspectionReports: { id: "id", visitDate: "visit_date" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  desc: vi.fn((col: unknown) => ({ type: "desc", col })),
  gte: vi.fn((...args: unknown[]) => ({ type: "gte", args })),
  lte: vi.fn((...args: unknown[]) => ({ type: "lte", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  sql: Object.assign(vi.fn(), { raw: vi.fn() }),
}));

import { getVetInspectionReports, getVetInspectionReportById, countReportsThisWeek } from "./vet-inspection-reports";
import { db } from "@/lib/db";

const sampleReport = {
  id: 1,
  visitDate: "2026-02-27",
  vetUserId: 5,
  vetName: "Dr. Janssen",
  vetSignature: false,
  signedAt: null,
  animalsTreated: [],
  animalsEuthanized: [],
  abnormalBehavior: [],
  recommendations: null,
  createdAt: new Date(),
};

describe("getVetInspectionReports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns reports sorted by visitDate desc", async () => {
    mockResults.push([sampleReport, { ...sampleReport, id: 2 }]);
    const result = await getVetInspectionReports();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
  });

  it("returns empty array when no reports exist", async () => {
    mockResults.push([]);
    const result = await getVetInspectionReports();
    expect(result).toEqual([]);
  });

  it("returns empty array on database error", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });
    const result = await getVetInspectionReports();
    expect(result).toEqual([]);
  });
});

describe("getVetInspectionReportById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns report when found", async () => {
    mockResults.push([sampleReport]);
    const result = await getVetInspectionReportById(1);
    expect(result).toEqual(sampleReport);
  });

  it("returns null when not found", async () => {
    mockResults.push([]);
    const result = await getVetInspectionReportById(999);
    expect(result).toBeNull();
  });

  it("returns null on database error", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });
    const result = await getVetInspectionReportById(1);
    expect(result).toBeNull();
  });
});

describe("countReportsThisWeek", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns count of reports this week", async () => {
    mockResults.push([{ count: 2 }]);
    const result = await countReportsThisWeek();
    expect(result).toBe(2);
  });

  it("returns 0 when no reports this week", async () => {
    mockResults.push([{ count: 0 }]);
    const result = await countReportsThisWeek();
    expect(result).toBe(0);
  });
});
