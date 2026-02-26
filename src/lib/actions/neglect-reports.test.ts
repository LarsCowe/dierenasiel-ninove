import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockReturning, mockValues, mockInsert,
  mockUpdateReturning, mockUpdateWhere, mockUpdateSet, mockUpdate,
  mockSelectLimit, mockSelectWhere, mockSelectReturning,
  mockRequirePermission, mockLogAudit, mockRevalidatePath,
} = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

  const mockUpdateReturning = vi.fn();
  const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning });
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectReturning = vi.fn().mockReturnValue({ where: mockSelectWhere });

  const mockRequirePermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  return {
    mockReturning, mockValues, mockInsert,
    mockUpdateReturning, mockUpdateWhere, mockUpdateSet, mockUpdate,
    mockSelectLimit, mockSelectWhere, mockSelectReturning,
    mockRequirePermission, mockLogAudit, mockRevalidatePath,
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
    select: vi.fn().mockReturnValue({ from: mockSelectReturning }),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@/lib/db/schema", () => ({
  neglectReports: Symbol("neglectReports"),
}));

vi.mock("@/lib/permissions", () => ({
  requirePermission: mockRequirePermission,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

import { createNeglectReport, updateNeglectReport } from "./neglect-reports";
import { neglectReports } from "@/lib/db/schema";

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value);
  }
  return fd;
}

const validFormData = {
  animalId: "1",
  healthStatusOnArrival: "Ernstig ondervoed, uitgedroogd",
  neglectFindings: "Langdurige verwaarlozing, geen voer of water",
  date: "2026-02-26",
  vetName: "Dr. Janssens",
};

const createdReport = {
  id: 1,
  animalId: 1,
  date: "2026-02-26",
  vetName: "Dr. Janssens",
  healthStatusOnArrival: "Ernstig ondervoed, uitgedroogd",
  neglectFindings: "Langdurige verwaarlozing, geen voer of water",
  treatmentsGiven: null,
  weightOnArrival: null,
  photos: null,
  notes: null,
  createdAt: new Date(),
};

describe("createNeglectReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockReturning.mockResolvedValue([createdReport]);
  });

  it("requires medical:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });

    const result = await createNeglectReport(null, makeFormData(validFormData));

    expect(mockRequirePermission).toHaveBeenCalledWith("medical:write");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Onvoldoende rechten");
    }
  });

  it("returns fieldErrors when validation fails", async () => {
    const result = await createNeglectReport(null, makeFormData({
      animalId: "1",
      healthStatusOnArrival: "",
      neglectFindings: "",
    }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors!.healthStatusOnArrival).toBeDefined();
      expect(result.fieldErrors!.neglectFindings).toBeDefined();
    }
  });

  it("creates report with correct values", async () => {
    await createNeglectReport(null, makeFormData(validFormData));

    expect(mockInsert).toHaveBeenCalledWith(neglectReports);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        animalId: 1,
        healthStatusOnArrival: "Ernstig ondervoed, uitgedroogd",
        neglectFindings: "Langdurige verwaarlozing, geen voer of water",
        date: "2026-02-26",
        vetName: "Dr. Janssens",
      }),
    );
  });

  it("calls logAudit after successful creation", async () => {
    const result = await createNeglectReport(null, makeFormData(validFormData));

    expect(result.success).toBe(true);
    expect(mockLogAudit).toHaveBeenCalledWith(
      "create_neglect_report",
      "neglect_report",
      1,
      null,
      expect.objectContaining({ id: 1 }),
    );
  });

  it("returns success with created report data", async () => {
    const result = await createNeglectReport(null, makeFormData(validFormData));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(expect.objectContaining({
        id: 1,
        animalId: 1,
      }));
    }
  });

  it("handles photos from FormData as JSON array", async () => {
    const fd = makeFormData({
      ...validFormData,
      photos: JSON.stringify(["https://example.com/a.jpg", "https://example.com/b.jpg"]),
    });

    await createNeglectReport(null, fd);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        photos: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
      }),
    );
  });

  it("returns field error on duplicate animal_id (unique constraint)", async () => {
    mockReturning.mockRejectedValue(
      Object.assign(new Error("unique violation"), { code: "23505" }),
    );

    const result = await createNeglectReport(null, makeFormData(validFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it("returns graceful error on DB failure", async () => {
    mockReturning.mockRejectedValue(new Error("Connection refused"));

    const result = await createNeglectReport(null, makeFormData(validFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it("revalidates the dieren path after creation", async () => {
    await createNeglectReport(null, makeFormData(validFormData));

    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren");
  });
});

describe("updateNeglectReport", () => {
  const existingReport = {
    ...createdReport,
    id: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockSelectLimit.mockResolvedValue([existingReport]);
    mockUpdateReturning.mockResolvedValue([{
      ...existingReport,
      healthStatusOnArrival: "Bijgewerkt status",
      treatmentsGiven: "Infuus, antibiotica",
    }]);
  });

  it("requires medical:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });

    const result = await updateNeglectReport(null, makeFormData({
      ...validFormData,
      id: "1",
    }));

    expect(mockRequirePermission).toHaveBeenCalledWith("medical:write");
    expect(result.success).toBe(false);
  });

  it("returns error when report not found", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await updateNeglectReport(null, makeFormData({
      ...validFormData,
      id: "999",
    }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Rapport niet gevonden");
    }
  });

  it("updates report and returns updated data", async () => {
    const result = await updateNeglectReport(null, makeFormData({
      ...validFormData,
      id: "1",
      treatmentsGiven: "Infuus, antibiotica",
    }));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.treatmentsGiven).toBe("Infuus, antibiotica");
    }
  });

  it("logs audit with old and new values", async () => {
    await updateNeglectReport(null, makeFormData({
      ...validFormData,
      id: "1",
    }));

    expect(mockLogAudit).toHaveBeenCalledWith(
      "update_neglect_report",
      "neglect_report",
      1,
      existingReport,
      expect.objectContaining({ id: 1 }),
    );
  });

  it("revalidates the dieren path after update", async () => {
    await updateNeglectReport(null, makeFormData({
      ...validFormData,
      id: "1",
    }));

    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren");
  });

  it("returns graceful error on DB failure", async () => {
    mockUpdateReturning.mockRejectedValue(new Error("Connection refused"));

    const result = await updateNeglectReport(null, makeFormData({
      ...validFormData,
      id: "1",
    }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});
