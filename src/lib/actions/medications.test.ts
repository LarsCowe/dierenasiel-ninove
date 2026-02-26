import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockReturning, mockInsert,
  mockDeleteWhere, mockDelete,
  mockUpdateWhere, mockUpdateSet, mockUpdate,
  mockSelectLimit, mockSelectWhere, mockSelectFrom,
  mockRequirePermission, mockLogAudit, mockRevalidatePath, mockGetSession,
  mockGetAnimalById,
} = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockInsert = vi.fn();
  const mockDeleteWhere = vi.fn();
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });
  const mockUpdateWhere = vi.fn();
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockRequirePermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  const mockGetSession = vi.fn();
  const mockGetAnimalById = vi.fn();
  return {
    mockReturning, mockInsert,
    mockDeleteWhere, mockDelete,
    mockUpdateWhere, mockUpdateSet, mockUpdate,
    mockSelectLimit, mockSelectWhere, mockSelectFrom,
    mockRequirePermission, mockLogAudit, mockRevalidatePath, mockGetSession,
    mockGetAnimalById,
  };
});

vi.mock("@/lib/db", () => {
  const mockValuesChain = vi.fn().mockReturnValue({ returning: mockReturning });
  mockInsert.mockReturnValue({ values: mockValuesChain });
  mockUpdateWhere.mockReturnValue({ returning: mockReturning });
  return {
    db: {
      insert: mockInsert,
      delete: mockDelete,
      update: mockUpdate,
      select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/db/schema", () => ({
  medications: { id: Symbol("medications.id") },
}));
vi.mock("@/lib/permissions", () => ({ requirePermission: mockRequirePermission }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/queries/animals", () => ({ getAnimalById: mockGetAnimalById }));
vi.mock("drizzle-orm", () => ({ eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })) }));

import { createMedication, stopMedication, deleteMedication } from "./medications";

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) fd.append(key, value);
  return fd;
}

const validFormData = {
  animalId: "1",
  medicationName: "Amoxicilline",
  dosage: "2x daags 1 tablet",
  startDate: "2026-02-26",
};

const createdRecord = {
  id: 1, animalId: 1, medicationName: "Amoxicilline", dosage: "2x daags 1 tablet",
  quantity: null, startDate: "2026-02-26", endDate: null, isActive: true,
  recordedBy: 5, notes: null, createdAt: new Date(),
};

describe("createMedication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ userId: 5, role: "dierenarts" });
    mockGetAnimalById.mockResolvedValue({ id: 1, name: "Buddy" });
    mockReturning.mockResolvedValue([createdRecord]);
  });

  it("requires medical:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await createMedication(null, makeFormData(validFormData));
    expect(mockRequirePermission).toHaveBeenCalledWith("medical:write");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Onvoldoende rechten");
  });

  it("returns fieldErrors when medicationName is missing", async () => {
    const result = await createMedication(null, makeFormData({ ...validFormData, medicationName: "" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors?.medicationName).toBeDefined();
  });

  it("returns fieldErrors when dosage is missing", async () => {
    const result = await createMedication(null, makeFormData({ ...validFormData, dosage: "" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors?.dosage).toBeDefined();
  });

  it("returns fieldErrors when startDate is missing", async () => {
    const result = await createMedication(null, makeFormData({ ...validFormData, startDate: "" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors?.startDate).toBeDefined();
  });

  it("returns error when animal does not exist", async () => {
    mockGetAnimalById.mockResolvedValue(null);
    const result = await createMedication(null, makeFormData(validFormData));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Dier niet gevonden");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("creates record with recordedBy from session", async () => {
    const result = await createMedication(null, makeFormData(validFormData));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("stores notes and quantity when provided", async () => {
    const result = await createMedication(null, makeFormData({
      ...validFormData, notes: "Na het eten", quantity: "30 tabletten",
    }));
    expect(result.success).toBe(true);
  });

  it("converts empty endDate to null", async () => {
    const result = await createMedication(null, makeFormData({ ...validFormData, endDate: "" }));
    expect(result.success).toBe(true);
  });

  it("calls logAudit after success", async () => {
    await createMedication(null, makeFormData(validFormData));
    expect(mockLogAudit).toHaveBeenCalledWith("create_medication", "medication", 1, null, expect.objectContaining({ id: 1 }));
  });

  it("revalidates dieren path", async () => {
    await createMedication(null, makeFormData(validFormData));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren");
  });

  it("returns graceful error on DB failure", async () => {
    mockReturning.mockRejectedValue(new Error("Connection refused"));
    const result = await createMedication(null, makeFormData(validFormData));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeDefined();
  });
});

describe("stopMedication", () => {
  const existingRecord = { ...createdRecord, isActive: true, endDate: null };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockSelectLimit.mockResolvedValue([existingRecord]);
    mockReturning.mockResolvedValue([{ ...existingRecord, isActive: false, endDate: "2026-02-26" }]);
  });

  it("requires medical:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await stopMedication(null, makeFormData({ id: "1" }));
    expect(result.success).toBe(false);
  });

  it("returns error when id is invalid", async () => {
    const result = await stopMedication(null, makeFormData({ id: "abc" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Ongeldig medicatie-ID");
  });

  it("returns error when not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await stopMedication(null, makeFormData({ id: "999" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Medicatie niet gevonden");
  });

  it("stops medication successfully", async () => {
    const result = await stopMedication(null, makeFormData({ id: "1" }));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("calls logAudit with old and new values", async () => {
    await stopMedication(null, makeFormData({ id: "1" }));
    expect(mockLogAudit).toHaveBeenCalledWith("stop_medication", "medication", 1, existingRecord, expect.objectContaining({ isActive: false }));
  });

  it("revalidates dieren path", async () => {
    await stopMedication(null, makeFormData({ id: "1" }));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren");
  });

  it("returns graceful error on DB failure", async () => {
    mockReturning.mockRejectedValue(new Error("Connection refused"));
    const result = await stopMedication(null, makeFormData({ id: "1" }));
    expect(result.success).toBe(false);
  });
});

describe("deleteMedication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockSelectLimit.mockResolvedValue([createdRecord]);
    mockDeleteWhere.mockResolvedValue(undefined);
  });

  it("requires medical:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await deleteMedication(null, makeFormData({ id: "1" }));
    expect(result.success).toBe(false);
  });

  it("returns error when id is invalid", async () => {
    const result = await deleteMedication(null, makeFormData({ id: "abc" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Ongeldig medicatie-ID");
  });

  it("returns error when not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await deleteMedication(null, makeFormData({ id: "999" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Medicatie niet gevonden");
  });

  it("deletes successfully", async () => {
    const result = await deleteMedication(null, makeFormData({ id: "1" }));
    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
  });

  it("calls logAudit with old value", async () => {
    await deleteMedication(null, makeFormData({ id: "1" }));
    expect(mockLogAudit).toHaveBeenCalledWith("delete_medication", "medication", 1, createdRecord, null);
  });

  it("revalidates dieren path", async () => {
    await deleteMedication(null, makeFormData({ id: "1" }));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren");
  });

  it("returns graceful error on DB failure", async () => {
    mockDeleteWhere.mockRejectedValue(new Error("Connection refused"));
    const result = await deleteMedication(null, makeFormData({ id: "1" }));
    expect(result.success).toBe(false);
  });
});
