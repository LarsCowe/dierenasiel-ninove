import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockReturning, mockInsert,
  mockDeleteWhere, mockDelete,
  mockSelectLimit, mockSelectWhere, mockSelectFrom,
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
  const mockRequirePermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  const mockGetSession = vi.fn();
  const mockGetAnimalById = vi.fn();
  return {
    mockReturning, mockInsert,
    mockDeleteWhere, mockDelete,
    mockSelectLimit, mockSelectWhere, mockSelectFrom,
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
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/db/schema", () => ({
  vaccinations: { id: Symbol("vaccinations.id") },
}));
vi.mock("@/lib/permissions", () => ({ requirePermission: mockRequirePermission }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/queries/animals", () => ({ getAnimalById: mockGetAnimalById }));
vi.mock("drizzle-orm", () => ({ eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })) }));

import { createVaccination, deleteVaccination } from "./vaccinations";

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) fd.append(key, value);
  return fd;
}

const validFormData = { animalId: "1", type: "DHP", date: "2026-02-26" };
const createdRecord = { id: 1, animalId: 1, type: "DHP", date: "2026-02-26", nextDueDate: null, administeredBy: 5, notes: null, createdAt: new Date() };

describe("createVaccination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ userId: 5, role: "dierenarts" });
    mockGetAnimalById.mockResolvedValue({ id: 1, name: "Buddy" });
    mockReturning.mockResolvedValue([createdRecord]);
  });

  it("requires medical:first_check permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await createVaccination(null, makeFormData(validFormData));
    expect(mockRequirePermission).toHaveBeenCalledWith("medical:first_check");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Onvoldoende rechten");
  });

  it("returns fieldErrors when type is invalid", async () => {
    const result = await createVaccination(null, makeFormData({ ...validFormData, type: "Rabiës" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors?.type).toBeDefined();
  });

  it("returns fieldErrors when date is missing", async () => {
    const result = await createVaccination(null, makeFormData({ ...validFormData, date: "" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors?.date).toBeDefined();
  });

  it("returns error when animal does not exist", async () => {
    mockGetAnimalById.mockResolvedValue(null);
    const result = await createVaccination(null, makeFormData(validFormData));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Dier niet gevonden");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("creates record with administered_by from session", async () => {
    const result = await createVaccination(null, makeFormData(validFormData));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("stores nextDueDate when provided", async () => {
    const result = await createVaccination(null, makeFormData({ ...validFormData, nextDueDate: "2027-02-26" }));
    expect(result.success).toBe(true);
  });

  it("calls logAudit after success", async () => {
    await createVaccination(null, makeFormData(validFormData));
    expect(mockLogAudit).toHaveBeenCalledWith("create_vaccination", "vaccination", 1, null, expect.objectContaining({ id: 1 }));
  });

  it("returns success with created record", async () => {
    const result = await createVaccination(null, makeFormData(validFormData));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(expect.objectContaining({ id: 1, type: "DHP" }));
  });

  it("revalidates dieren path", async () => {
    await createVaccination(null, makeFormData(validFormData));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren");
  });

  it("returns graceful error on DB failure", async () => {
    mockReturning.mockRejectedValue(new Error("Connection refused"));
    const result = await createVaccination(null, makeFormData(validFormData));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeDefined();
  });
});

describe("deleteVaccination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockSelectLimit.mockResolvedValue([createdRecord]);
    mockDeleteWhere.mockResolvedValue(undefined);
  });

  it("requires medical:first_check permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await deleteVaccination(null, makeFormData({ id: "1" }));
    expect(mockRequirePermission).toHaveBeenCalledWith("medical:first_check");
    expect(result.success).toBe(false);
  });

  it("returns error when id is invalid", async () => {
    const result = await deleteVaccination(null, makeFormData({ id: "abc" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Ongeldig vaccinatie-ID");
  });

  it("returns error when not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await deleteVaccination(null, makeFormData({ id: "999" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Vaccinatie niet gevonden");
  });

  it("deletes successfully", async () => {
    const result = await deleteVaccination(null, makeFormData({ id: "1" }));
    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
  });

  it("calls logAudit with old value", async () => {
    await deleteVaccination(null, makeFormData({ id: "1" }));
    expect(mockLogAudit).toHaveBeenCalledWith("delete_vaccination", "vaccination", 1, createdRecord, null);
  });

  it("revalidates dieren path", async () => {
    await deleteVaccination(null, makeFormData({ id: "1" }));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren");
  });

  it("returns graceful error on DB failure", async () => {
    mockDeleteWhere.mockRejectedValue(new Error("Connection refused"));
    const result = await deleteVaccination(null, makeFormData({ id: "1" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeDefined();
  });
});
