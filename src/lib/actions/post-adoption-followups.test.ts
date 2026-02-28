import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockReturning, mockInsert,
  mockSelectLimit, mockSelectWhere, mockSelectFrom,
  mockUpdateSetWhere, mockUpdateSet, mockUpdate,
  mockRequirePermission, mockLogAudit, mockRevalidatePath,
} = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockInsert = vi.fn();
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockUpdateSetWhere = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateSetWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
  const mockRequirePermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  return {
    mockReturning, mockInsert,
    mockSelectLimit, mockSelectWhere, mockSelectFrom,
    mockUpdateSetWhere, mockUpdateSet, mockUpdate,
    mockRequirePermission, mockLogAudit, mockRevalidatePath,
  };
});

vi.mock("@/lib/db", () => {
  const mockValuesChain = vi.fn().mockReturnValue({ returning: mockReturning });
  mockInsert.mockReturnValue({ values: mockValuesChain });
  return {
    db: {
      insert: mockInsert,
      update: mockUpdate,
      select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/db/schema", () => ({
  postAdoptionFollowups: {
    id: Symbol("postAdoptionFollowups.id"),
    contractId: Symbol("postAdoptionFollowups.contractId"),
    status: Symbol("postAdoptionFollowups.status"),
  },
  adoptionContracts: { id: Symbol("adoptionContracts.id") },
}));
vi.mock("@/lib/permissions", () => ({ requirePermission: mockRequirePermission }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));

import { updateFollowupStatus, createCustomFollowup } from "./post-adoption-followups";

// ─── Helper ──────────────────────────────────────────────────────────

function makeFormData(json: unknown): FormData {
  const fd = new FormData();
  fd.append("json", JSON.stringify(json));
  return fd;
}

// ─── updateFollowupStatus ────────────────────────────────────────────

const existingFollowup = {
  id: 1,
  contractId: 5,
  followupType: "1_week",
  date: "2026-03-22",
  notes: null,
  status: "planned",
  createdAt: new Date(),
};

describe("updateFollowupStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockSelectLimit.mockResolvedValue([existingFollowup]);
    mockReturning.mockResolvedValue([{ ...existingFollowup, status: "completed", notes: "Dier doet het goed" }]);
  });

  it("requires adoption:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await updateFollowupStatus(null, makeFormData({ id: 1, status: "completed" }));
    expect(mockRequirePermission).toHaveBeenCalledWith("adoption:write");
    expect(result.success).toBe(false);
  });

  it("returns error when JSON is invalid", async () => {
    const fd = new FormData();
    fd.append("json", "not-json");
    const result = await updateFollowupStatus(null, fd);
    expect(result.success).toBe(false);
  });

  it("returns validation error for invalid status", async () => {
    const result = await updateFollowupStatus(null, makeFormData({ id: 1, status: "planned" }));
    expect(result.success).toBe(false);
  });

  it("returns error when followup not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await updateFollowupStatus(null, makeFormData({ id: 999, status: "completed" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Opvolging niet gevonden");
  });

  it("returns error when followup is not planned", async () => {
    mockSelectLimit.mockResolvedValue([{ ...existingFollowup, status: "completed" }]);
    const result = await updateFollowupStatus(null, makeFormData({ id: 1, status: "completed" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("reeds");
  });

  it("updates followup status to completed with notes", async () => {
    const result = await updateFollowupStatus(null, makeFormData({ id: 1, status: "completed", notes: "Goed" }));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("updates followup status to no_response", async () => {
    mockReturning.mockResolvedValue([{ ...existingFollowup, status: "no_response" }]);
    const result = await updateFollowupStatus(null, makeFormData({ id: 1, status: "no_response" }));
    expect(result.success).toBe(true);
  });

  it("calls logAudit on success", async () => {
    await updateFollowupStatus(null, makeFormData({ id: 1, status: "completed", notes: "OK" }));
    expect(mockLogAudit).toHaveBeenCalledWith(
      "update_followup_status", "post_adoption_followup", 1,
      expect.objectContaining({ status: "planned" }),
      expect.objectContaining({ status: "completed" }),
    );
  });

  it("revalidates adoptie paths", async () => {
    await updateFollowupStatus(null, makeFormData({ id: 1, status: "completed" }));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/adoptie");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/adoptie/opvolging");
  });

  it("returns graceful error on DB failure", async () => {
    mockSelectLimit.mockRejectedValue(new Error("DB down"));
    const result = await updateFollowupStatus(null, makeFormData({ id: 1, status: "completed" }));
    expect(result.success).toBe(false);
  });
});

// ─── createCustomFollowup ────────────────────────────────────────────

const existingContract = {
  id: 5,
  animalId: 10,
  candidateId: 2,
  contractDate: "2026-03-15",
};

const createdFollowup = {
  id: 3,
  contractId: 5,
  followupType: "custom",
  date: "2026-04-15",
  notes: "Extra check",
  status: "planned",
  createdAt: new Date(),
};

describe("createCustomFollowup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockSelectLimit.mockResolvedValue([existingContract]);
    mockReturning.mockResolvedValue([createdFollowup]);
  });

  it("requires adoption:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await createCustomFollowup(null, makeFormData({ contractId: 5, date: "2026-04-15" }));
    expect(mockRequirePermission).toHaveBeenCalledWith("adoption:write");
    expect(result.success).toBe(false);
  });

  it("returns error when JSON is invalid", async () => {
    const fd = new FormData();
    fd.append("json", "bad");
    const result = await createCustomFollowup(null, fd);
    expect(result.success).toBe(false);
  });

  it("returns validation error for invalid date format", async () => {
    const result = await createCustomFollowup(null, makeFormData({ contractId: 5, date: "15-04-2026" }));
    expect(result.success).toBe(false);
  });

  it("returns error when contract not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await createCustomFollowup(null, makeFormData({ contractId: 999, date: "2026-04-15" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Contract niet gevonden");
  });

  it("creates custom followup successfully", async () => {
    const result = await createCustomFollowup(null, makeFormData({ contractId: 5, date: "2026-04-15", notes: "Extra" }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("calls logAudit on success", async () => {
    await createCustomFollowup(null, makeFormData({ contractId: 5, date: "2026-04-15" }));
    expect(mockLogAudit).toHaveBeenCalledWith(
      "create_custom_followup", "post_adoption_followup", 3, null, expect.objectContaining({ id: 3 }),
    );
  });

  it("revalidates adoptie paths", async () => {
    await createCustomFollowup(null, makeFormData({ contractId: 5, date: "2026-04-15" }));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/adoptie");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/adoptie/opvolging");
  });

  it("returns graceful error on DB failure", async () => {
    mockReturning.mockRejectedValue(new Error("DB down"));
    const result = await createCustomFollowup(null, makeFormData({ contractId: 5, date: "2026-04-15" }));
    expect(result.success).toBe(false);
  });
});
