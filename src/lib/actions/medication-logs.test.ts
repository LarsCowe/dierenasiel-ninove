import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockReturning, mockInsert,
  mockDeleteWhere, mockDelete,
  mockSelectLimit, mockSelectWhere, mockSelectFrom,
  mockRequirePermission, mockLogAudit, mockRevalidatePath, mockGetSession,
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
  return {
    mockReturning, mockInsert,
    mockDeleteWhere, mockDelete,
    mockSelectLimit, mockSelectWhere, mockSelectFrom,
    mockRequirePermission, mockLogAudit, mockRevalidatePath, mockGetSession,
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
  medicationLogs: { id: Symbol("medicationLogs.id") },
  medications: { id: Symbol("medications.id") },
}));
vi.mock("@/lib/permissions", () => ({ requirePermission: mockRequirePermission }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  gte: vi.fn((...args: unknown[]) => ({ type: "gte", args })),
  lt: vi.fn((...args: unknown[]) => ({ type: "lt", args })),
}));

import { createMedicationLog, deleteMedicationLog } from "./medication-logs";

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) fd.append(key, value);
  return fd;
}

const createdLog = {
  id: 1, medicationId: 5, administeredAt: new Date(),
  administeredBy: "Jan Peeters", administeredByUserId: 3,
  notes: null, createdAt: new Date(),
};

const existingMedication = {
  id: 5, animalId: 1, medicationName: "Amoxicilline", dosage: "2x daags",
  isActive: true, startDate: "2026-02-26",
};

describe("createMedicationLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ userId: 3, name: "Jan Peeters", role: "medewerker" });
    // First select: medication check, second select: idempotency check
    mockSelectLimit
      .mockResolvedValueOnce([existingMedication])
      .mockResolvedValueOnce([]);
    mockReturning.mockResolvedValue([createdLog]);
  });

  it("requires medical:first_check permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await createMedicationLog(null, makeFormData({ medicationId: "5" }));
    expect(mockRequirePermission).toHaveBeenCalledWith("medical:first_check");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Onvoldoende rechten");
  });

  it("returns fieldErrors when medicationId is invalid", async () => {
    const result = await createMedicationLog(null, makeFormData({ medicationId: "0" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors?.medicationId).toBeDefined();
  });

  it("returns error when medication does not exist", async () => {
    mockSelectLimit.mockReset();
    mockSelectLimit.mockResolvedValueOnce([]);
    const result = await createMedicationLog(null, makeFormData({ medicationId: "5" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Medicatie niet gevonden");
  });

  it("returns error when medication is not active", async () => {
    mockSelectLimit.mockReset();
    mockSelectLimit.mockResolvedValueOnce([{ ...existingMedication, isActive: false }]);
    const result = await createMedicationLog(null, makeFormData({ medicationId: "5" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Medicatie is niet meer actief");
  });

  it("returns error when already checked off today", async () => {
    mockSelectLimit.mockReset();
    mockSelectLimit
      .mockResolvedValueOnce([existingMedication])
      .mockResolvedValueOnce([createdLog]);
    const result = await createMedicationLog(null, makeFormData({ medicationId: "5" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Deze medicatie is vandaag al afgevinkt");
  });

  it("creates log with administeredAt and administeredBy from session", async () => {
    const result = await createMedicationLog(null, makeFormData({ medicationId: "5" }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("stores notes when provided", async () => {
    const result = await createMedicationLog(null, makeFormData({ medicationId: "5", notes: "Goed ingenomen" }));
    expect(result.success).toBe(true);
  });

  it("calls logAudit after success", async () => {
    await createMedicationLog(null, makeFormData({ medicationId: "5" }));
    expect(mockLogAudit).toHaveBeenCalledWith(
      "create_medication_log", "medication_log", 1, null, expect.objectContaining({ id: 1 }),
    );
  });

  it("revalidates medisch and dieren paths", async () => {
    await createMedicationLog(null, makeFormData({ medicationId: "5" }));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/medisch");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren");
  });

  it("returns graceful error on DB failure", async () => {
    mockReturning.mockRejectedValue(new Error("Connection refused"));
    const result = await createMedicationLog(null, makeFormData({ medicationId: "5" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeDefined();
  });
});

describe("deleteMedicationLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockSelectLimit.mockResolvedValue([createdLog]);
    mockDeleteWhere.mockResolvedValue(undefined);
  });

  it("requires medical:first_check permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await deleteMedicationLog(null, makeFormData({ id: "1" }));
    expect(mockRequirePermission).toHaveBeenCalledWith("medical:first_check");
    expect(result.success).toBe(false);
  });

  it("returns error when id is invalid", async () => {
    const result = await deleteMedicationLog(null, makeFormData({ id: "abc" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Ongeldig log-ID");
  });

  it("returns error when not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await deleteMedicationLog(null, makeFormData({ id: "999" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Log niet gevonden");
  });

  it("deletes successfully", async () => {
    const result = await deleteMedicationLog(null, makeFormData({ id: "1" }));
    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
  });

  it("calls logAudit with old value", async () => {
    await deleteMedicationLog(null, makeFormData({ id: "1" }));
    expect(mockLogAudit).toHaveBeenCalledWith(
      "delete_medication_log", "medication_log", 1, createdLog, null,
    );
  });

  it("revalidates medisch and dieren paths", async () => {
    await deleteMedicationLog(null, makeFormData({ id: "1" }));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/medisch");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren");
  });

  it("returns graceful error on DB failure", async () => {
    mockDeleteWhere.mockRejectedValue(new Error("Connection refused"));
    const result = await deleteMedicationLog(null, makeFormData({ id: "1" }));
    expect(result.success).toBe(false);
  });
});
