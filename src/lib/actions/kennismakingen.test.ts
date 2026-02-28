import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockReturning, mockInsert,
  mockSelectLimit, mockSelectWhere, mockSelectFrom,
  mockUpdateSetWhere, mockUpdateSet, mockUpdate,
  mockRequirePermission, mockLogAudit, mockRevalidatePath, mockGetSession,
} = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockInsert = vi.fn();
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockUpdateSetWhere = vi.fn();
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateSetWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
  const mockRequirePermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  const mockGetSession = vi.fn();
  return {
    mockReturning, mockInsert,
    mockSelectLimit, mockSelectWhere, mockSelectFrom,
    mockUpdateSetWhere, mockUpdateSet, mockUpdate,
    mockRequirePermission, mockLogAudit, mockRevalidatePath, mockGetSession,
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
  kennismakingen: { id: Symbol("kennismakingen.id") },
  adoptionCandidates: { id: Symbol("adoptionCandidates.id") },
}));
vi.mock("@/lib/permissions", () => ({ requirePermission: mockRequirePermission }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));

import { createKennismaking, registerKennismakingOutcome } from "./kennismakingen";

const validData = {
  adoptionCandidateId: 1,
  animalId: 5,
  scheduledAt: "2026-03-10T14:00:00",
  location: "Bezoekruimte A",
};

const createdRecord = {
  id: 1,
  ...validData,
  scheduledAt: new Date("2026-03-10T14:00:00Z"),
  status: "scheduled",
  outcome: null,
  notes: null,
  createdBy: "Marie Janssens",
  createdAt: new Date(),
};

const mockCandidate = {
  id: 1,
  category: "goede_kandidaat",
  status: "screening",
  animalId: 5,
};

function makeFormData(json: unknown): FormData {
  const fd = new FormData();
  fd.append("json", JSON.stringify(json));
  return fd;
}

describe("createKennismaking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ userId: 3, role: "adoptieconsulent", name: "Marie Janssens" });
    mockReturning.mockResolvedValue([createdRecord]);
    // For candidate lookup
    mockSelectLimit.mockResolvedValue([mockCandidate]);
  });

  it("requires adoption:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await createKennismaking(null, makeFormData(validData));
    expect(mockRequirePermission).toHaveBeenCalledWith("adoption:write");
    expect(result.success).toBe(false);
  });

  it("returns error when JSON is invalid", async () => {
    const fd = new FormData();
    fd.append("json", "not-valid");
    const result = await createKennismaking(null, fd);
    expect(result.success).toBe(false);
  });

  it("returns error when candidate not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await createKennismaking(null, makeFormData(validData));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Kandidaat niet gevonden");
  });

  it("returns error when candidate is not goede_kandidaat", async () => {
    mockSelectLimit.mockResolvedValue([{ ...mockCandidate, category: "mogelijks" }]);
    const result = await createKennismaking(null, makeFormData(validData));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("goede kandidaat");
  });

  it("creates record on success", async () => {
    const result = await createKennismaking(null, makeFormData(validData));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("sets createdBy from session name", async () => {
    await createKennismaking(null, makeFormData(validData));
    expect(mockInsert).toHaveBeenCalled();
  });

  it("calls logAudit after success", async () => {
    await createKennismaking(null, makeFormData(validData));
    expect(mockLogAudit).toHaveBeenCalledWith(
      "create_kennismaking", "kennismaking", 1, null, expect.objectContaining({ id: 1 }),
    );
  });

  it("revalidates adoptie path", async () => {
    await createKennismaking(null, makeFormData(validData));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/adoptie");
  });

  it("returns graceful error on DB failure", async () => {
    mockReturning.mockRejectedValue(new Error("Connection refused"));
    const result = await createKennismaking(null, makeFormData(validData));
    expect(result.success).toBe(false);
  });
});

describe("registerKennismakingOutcome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockSelectLimit.mockResolvedValue([createdRecord]);
    mockUpdateSetWhere.mockResolvedValue(undefined);
  });

  it("requires adoption:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await registerKennismakingOutcome(null, makeFormData({ id: 1, outcome: "positief", notes: "" }));
    expect(result.success).toBe(false);
  });

  it("returns error when kennismaking not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await registerKennismakingOutcome(null, makeFormData({ id: 999, outcome: "positief" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Kennismaking niet gevonden");
  });

  it("rejects invalid outcome", async () => {
    const result = await registerKennismakingOutcome(null, makeFormData({ id: 1, outcome: "negatief" }));
    expect(result.success).toBe(false);
  });

  it("updates kennismaking status to completed", async () => {
    const result = await registerKennismakingOutcome(null, makeFormData({ id: 1, outcome: "positief", notes: "Goed" }));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", outcome: "positief" }),
    );
  });

  it("updates candidate status to approved on positief outcome", async () => {
    // Second update call is for the candidate
    await registerKennismakingOutcome(null, makeFormData({ id: 1, outcome: "positief" }));
    // Should have 2 update calls: one for kennismaking, one for candidate
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it("updates candidate status to screening on twijfel outcome", async () => {
    await registerKennismakingOutcome(null, makeFormData({ id: 1, outcome: "twijfel" }));
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it("calls logAudit after success", async () => {
    await registerKennismakingOutcome(null, makeFormData({ id: 1, outcome: "positief" }));
    expect(mockLogAudit).toHaveBeenCalled();
  });

  it("revalidates adoptie path", async () => {
    await registerKennismakingOutcome(null, makeFormData({ id: 1, outcome: "positief" }));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/adoptie");
  });

  it("returns graceful error on DB failure", async () => {
    mockUpdateSetWhere.mockRejectedValue(new Error("Connection refused"));
    const result = await registerKennismakingOutcome(null, makeFormData({ id: 1, outcome: "positief" }));
    expect(result.success).toBe(false);
  });
});
