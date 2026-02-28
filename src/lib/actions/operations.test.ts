import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockReturning, mockInsert,
  mockDeleteWhere, mockDelete,
  mockSelectLimit, mockSelectWhere, mockSelectFrom,
  mockUpdateWhere, mockUpdateSet, mockUpdate,
  mockRequirePermission, mockLogAudit, mockRevalidatePath, mockGetSession,
  mockGetAnimalById,
} = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockInsert = vi.fn();
  const mockDeleteWhere = vi.fn();
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
  const mockRequirePermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  const mockGetSession = vi.fn();
  const mockGetAnimalById = vi.fn();
  return {
    mockReturning, mockInsert,
    mockDeleteWhere, mockDelete,
    mockSelectLimit, mockSelectWhere, mockSelectFrom,
    mockUpdateWhere, mockUpdateSet, mockUpdate,
    mockRequirePermission, mockLogAudit, mockRevalidatePath, mockGetSession,
    mockGetAnimalById,
  };
});

vi.mock("@/lib/db", () => {
  const mockValuesChain = vi.fn().mockReturnValue({ returning: mockReturning });
  mockInsert.mockReturnValue({ values: mockValuesChain });
  return {
    db: {
      insert: mockInsert,
      delete: mockDelete,
      select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
      update: mockUpdate,
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/db/schema", () => ({
  operations: { id: Symbol("operations.id") },
  animals: { id: Symbol("animals.id"), isNeutered: Symbol("animals.isNeutered") },
}));
vi.mock("@/lib/permissions", () => ({ requirePermission: mockRequirePermission }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/queries/animals", () => ({ getAnimalById: mockGetAnimalById }));
vi.mock("drizzle-orm", () => ({ eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })) }));

import { createOperation, deleteOperation } from "./operations";

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) fd.append(key, value);
  return fd;
}

const validFormData = { animalId: "1", type: "steriliseren", date: "2026-02-26" };
const createdRecord = { id: 1, animalId: 1, type: "steriliseren", date: "2026-02-26", recordedBy: 5, notes: null, createdAt: new Date() };

describe("createOperation", () => {
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
    const result = await createOperation(null, makeFormData(validFormData));
    expect(mockRequirePermission).toHaveBeenCalledWith("medical:write");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Onvoldoende rechten");
  });

  it("returns fieldErrors when type is invalid", async () => {
    const result = await createOperation(null, makeFormData({ ...validFormData, type: "onbekend" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors?.type).toBeDefined();
  });

  it("returns fieldErrors when date is missing", async () => {
    const result = await createOperation(null, makeFormData({ ...validFormData, date: "" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors?.date).toBeDefined();
  });

  it("returns error when animal does not exist", async () => {
    mockGetAnimalById.mockResolvedValue(null);
    const result = await createOperation(null, makeFormData(validFormData));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Dier niet gevonden");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("creates record with recordedBy from session", async () => {
    const result = await createOperation(null, makeFormData(validFormData));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("stores notes when provided", async () => {
    const result = await createOperation(null, makeFormData({ ...validFormData, notes: "Verliep goed" }));
    expect(result.success).toBe(true);
  });

  it("calls logAudit after success", async () => {
    await createOperation(null, makeFormData(validFormData));
    expect(mockLogAudit).toHaveBeenCalledWith("create_operation", "operation", 1, null, expect.objectContaining({ id: 1 }));
  });

  it("revalidates dieren path", async () => {
    await createOperation(null, makeFormData(validFormData));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren");
  });

  it("returns graceful error on DB failure", async () => {
    mockReturning.mockRejectedValue(new Error("Connection refused"));
    const result = await createOperation(null, makeFormData(validFormData));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeDefined();
  });

  it("sets is_neutered to true when type is steriliseren", async () => {
    const result = await createOperation(null, makeFormData({ ...validFormData, type: "steriliseren" }));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith({ isNeutered: true });
  });

  it("sets is_neutered to true when type is castreren", async () => {
    const result = await createOperation(null, makeFormData({ ...validFormData, type: "castreren" }));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith({ isNeutered: true });
  });

  it("does NOT set is_neutered for tanden_opkuisen", async () => {
    mockReturning.mockResolvedValue([{ ...createdRecord, type: "tanden_opkuisen" }]);
    const result = await createOperation(null, makeFormData({ ...validFormData, type: "tanden_opkuisen" }));
    expect(result.success).toBe(true);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("does NOT set is_neutered for gezwel_weghalen", async () => {
    mockReturning.mockResolvedValue([{ ...createdRecord, type: "gezwel_weghalen" }]);
    const result = await createOperation(null, makeFormData({ ...validFormData, type: "gezwel_weghalen" }));
    expect(result.success).toBe(true);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("deleteOperation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockSelectLimit.mockResolvedValue([createdRecord]);
    mockDeleteWhere.mockResolvedValue(undefined);
  });

  it("requires medical:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await deleteOperation(null, makeFormData({ id: "1" }));
    expect(result.success).toBe(false);
  });

  it("returns error when id is invalid", async () => {
    const result = await deleteOperation(null, makeFormData({ id: "abc" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Ongeldig operatie-ID");
  });

  it("returns error when not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await deleteOperation(null, makeFormData({ id: "999" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Operatie niet gevonden");
  });

  it("deletes successfully", async () => {
    const result = await deleteOperation(null, makeFormData({ id: "1" }));
    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
  });

  it("calls logAudit with old value", async () => {
    await deleteOperation(null, makeFormData({ id: "1" }));
    expect(mockLogAudit).toHaveBeenCalledWith("delete_operation", "operation", 1, createdRecord, null);
  });

  it("revalidates dieren path", async () => {
    await deleteOperation(null, makeFormData({ id: "1" }));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren");
  });

  it("returns graceful error on DB failure", async () => {
    mockDeleteWhere.mockRejectedValue(new Error("Connection refused"));
    const result = await deleteOperation(null, makeFormData({ id: "1" }));
    expect(result.success).toBe(false);
  });
});
