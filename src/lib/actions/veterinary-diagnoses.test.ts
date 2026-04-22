import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockRequirePermission,
  mockLogAudit,
  mockRevalidatePath,
  mockSelectLimit,
  mockInsertReturning,
  mockSelect,
  mockInsert,
} = vi.hoisted(() => {
  const mockRequirePermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });
  const mockInsertReturning = vi.fn();
  const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
  return {
    mockRequirePermission, mockLogAudit, mockRevalidatePath,
    mockSelectLimit, mockInsertReturning, mockSelect, mockInsert,
  };
});

vi.mock("@/lib/permissions", () => ({ requirePermission: mockRequirePermission }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/db", () => ({ db: { select: mockSelect, insert: mockInsert } }));
vi.mock("@/lib/db/schema", () => ({
  veterinaryDiagnoses: {
    id: Symbol("vd.id"),
    name: Symbol("vd.name"),
  },
}));
vi.mock("drizzle-orm", () => ({
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({ type: "sql", strings, values }),
    { raw: vi.fn() },
  ),
}));

import { addDiagnosisAction } from "./veterinary-diagnoses";

describe("addDiagnosisAction (Story 10.10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue({ success: true });
  });

  it("voegt een nieuwe diagnose toe en logt audit", async () => {
    mockSelectLimit.mockResolvedValue([]);
    mockInsertReturning.mockResolvedValue([{ id: 10, name: "Tekenbeet" }]);

    const result = await addDiagnosisAction({ name: "Tekenbeet" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ id: 10, name: "Tekenbeet" });
    expect(mockInsert).toHaveBeenCalled();
    expect(mockLogAudit).toHaveBeenCalledWith(
      "veterinary_diagnosis.added",
      "veterinary_diagnosis",
      10,
      null,
      { name: "Tekenbeet" },
    );
  });

  it("retourneert bestaande entry bij case-insensitive duplicate (geen insert)", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 5, name: "Oorontsteking" }]);

    const result = await addDiagnosisAction({ name: "oorontsteking" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ id: 5, name: "Oorontsteking" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("weigert invoer korter dan 2 tekens", async () => {
    const result = await addDiagnosisAction({ name: "a" });

    expect(result.success).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("weigert zonder permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });

    const result = await addDiagnosisAction({ name: "Geldige naam" });

    expect(result).toEqual({ success: false, error: "Onvoldoende rechten" });
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
