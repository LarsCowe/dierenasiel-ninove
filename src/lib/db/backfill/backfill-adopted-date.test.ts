import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockUpdateReturning,
  mockUpdateWhere,
  mockUpdateSet,
  mockUpdate,
} = vi.hoisted(() => {
  const mockUpdateReturning = vi.fn();
  const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning });
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

  return { mockUpdateReturning, mockUpdateWhere, mockUpdateSet, mockUpdate };
});

vi.mock("@/lib/db", () => ({
  db: {
    update: mockUpdate,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  animals: {
    id: Symbol("animals.id"),
    status: Symbol("animals.status"),
    outtakeReason: Symbol("animals.outtakeReason"),
    outtakeDate: Symbol("animals.outtakeDate"),
    adoptedDate: Symbol("animals.adoptedDate"),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ type: "eq", col, val })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  isNull: vi.fn((col: unknown) => ({ type: "isNull", col })),
  isNotNull: vi.fn((col: unknown) => ({ type: "isNotNull", col })),
  sql: Object.assign(
    (strings: TemplateStringsArray, ..._values: unknown[]) => ({ type: "sql", raw: strings.join("?") }),
    { raw: vi.fn() },
  ),
}));

import { backfillAdoptedDate } from "./backfill-adopted-date";

describe("backfillAdoptedDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates adoptedDate to outtakeDate for rows met ontbrekende adoptedDate", async () => {
    mockUpdateReturning.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

    const { updatedCount } = await backfillAdoptedDate();

    expect(updatedCount).toBe(3);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        adoptedDate: expect.objectContaining({ type: "sql" }),
      }),
    );
  });

  it("is idempotent: returns 0 wanneer geen rijen meer geüpdatet moeten worden", async () => {
    mockUpdateReturning.mockResolvedValue([]);

    const { updatedCount } = await backfillAdoptedDate();

    expect(updatedCount).toBe(0);
  });

  it("filtert op status=geadopteerd EN outtakeReason=adoptie EN adoptedDate IS NULL EN outtakeDate IS NOT NULL", async () => {
    mockUpdateReturning.mockResolvedValue([]);

    await backfillAdoptedDate();

    const whereArg = mockUpdateWhere.mock.calls[0][0];
    expect(whereArg.type).toBe("and");
    const conditions = whereArg.args;
    expect(conditions).toHaveLength(4);
    const types = conditions.map((c: { type: string }) => c.type);
    expect(types).toContain("eq");
    expect(types).toContain("isNull");
    expect(types).toContain("isNotNull");
  });
});
