import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockRequirePermission,
  mockLogAudit,
  mockRevalidatePath,
  mockSelectLimit,
  mockSelectWhere,
  mockSelectFrom,
  mockUpdateReturning,
  mockUpdateWhere,
  mockUpdateSet,
  mockUpdate,
} = vi.hoisted(() => {
  const mockRequirePermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();

  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });

  const mockUpdateReturning = vi.fn();
  const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning });
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

  return {
    mockRequirePermission,
    mockLogAudit,
    mockRevalidatePath,
    mockSelectLimit,
    mockSelectWhere,
    mockSelectFrom,
    mockUpdateReturning,
    mockUpdateWhere,
    mockUpdateSet,
    mockUpdate,
  };
});

vi.mock("@/lib/permissions", () => ({
  requirePermission: mockRequirePermission,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
    update: mockUpdate,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  animals: Symbol("animals"),
  kennels: Symbol("kennels"),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  sql: vi.fn((strings: TemplateStringsArray) => ({ type: "sql", value: strings.join("") })),
}));

import { assignKennel } from "./kennels";

const mockAnimal = { id: 1, name: "Rex", kennelId: null, isInShelter: true };
const mockKennel = { id: 5, code: "H3", zone: "honden", capacity: 2, isActive: true, notes: null };

describe("assignKennel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    // First select: animal lookup, second: kennel lookup, third: count
    mockSelectLimit.mockResolvedValue([mockAnimal]);
    mockUpdateReturning.mockResolvedValue([{ ...mockAnimal, kennelId: 5 }]);
  });

  it("requires kennel:write permission", async () => {
    mockRequirePermission.mockResolvedValue({
      success: false,
      error: "Onvoldoende rechten",
    });

    const result = await assignKennel(1, 5);

    expect(mockRequirePermission).toHaveBeenCalledWith("kennel:write");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Onvoldoende rechten");
  });

  it("returns error when animal not found", async () => {
    mockSelectLimit.mockResolvedValueOnce([]);

    const result = await assignKennel(999, 5);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("niet gevonden");
  });

  it("returns error when kennel not found", async () => {
    mockSelectLimit
      .mockResolvedValueOnce([mockAnimal]) // animal found
      .mockResolvedValueOnce([]); // kennel not found

    const result = await assignKennel(1, 999);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("niet gevonden");
  });

  it("assigns animal to kennel and logs audit", async () => {
    mockSelectLimit
      .mockResolvedValueOnce([mockAnimal]) // animal
      .mockResolvedValueOnce([mockKennel]) // kennel
      .mockResolvedValueOnce([{ count: 0 }]); // capacity check

    const result = await assignKennel(1, 5);

    expect(result.success).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ kennelId: 5 }),
    );
    expect(mockLogAudit).toHaveBeenCalledWith(
      "assign_kennel",
      "animal",
      1,
      expect.objectContaining({ kennelId: null }),
      expect.objectContaining({ kennelId: 5 }),
    );
  });

  it("revalidates paths after assignment", async () => {
    mockSelectLimit
      .mockResolvedValueOnce([mockAnimal])
      .mockResolvedValueOnce([mockKennel])
      .mockResolvedValueOnce([{ count: 0 }]);

    await assignKennel(1, 5);

    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren/kennel");
  });

  it("allows unassigning by passing null kennelId", async () => {
    mockSelectLimit.mockResolvedValueOnce([{ ...mockAnimal, kennelId: 5 }]);
    mockUpdateReturning.mockResolvedValue([{ ...mockAnimal, kennelId: null }]);

    const result = await assignKennel(1, null);

    expect(result.success).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ kennelId: null }),
    );
  });

  it("returns capacity warning when kennel is full but still assigns", async () => {
    mockSelectLimit
      .mockResolvedValueOnce([mockAnimal]) // animal
      .mockResolvedValueOnce([{ ...mockKennel, capacity: 2 }]) // kennel
      .mockResolvedValueOnce([{ count: 2 }]); // capacity check — full

    const result = await assignKennel(1, 5);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message).toContain("vol");
    }
  });
});
