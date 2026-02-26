import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockReturning, mockInsert,
  mockSelectLimit, mockSelectWhere, mockSelectFrom,
  mockRequirePermission, mockLogAudit, mockRevalidatePath,
} = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockInsert = vi.fn();

  const mockRequirePermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  return {
    mockReturning, mockInsert,
    mockSelectLimit, mockSelectWhere, mockSelectFrom,
    mockRequirePermission, mockLogAudit, mockRevalidatePath,
  };
});

vi.mock("@/lib/db", () => {
  const mockOnConflictDoUpdate = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockValuesChain = vi.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
  mockInsert.mockReturnValue({ values: mockValuesChain });

  return {
    db: {
      insert: mockInsert,
      select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
    },
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@/lib/db/schema", () => ({
  feedingPlans: { animalId: Symbol("feedingPlans.animalId") },
  animals: { id: Symbol("animals.id") },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));

vi.mock("@/lib/permissions", () => ({
  requirePermission: mockRequirePermission,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

import { upsertFeedingPlan } from "./feeding-plans";

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value);
  }
  return fd;
}

const validQuestionnaire = {
  dieetType: "droogvoer",
  merk: "Royal Canin",
  hoeveelheid: "200g per maaltijd",
  frequentie: "2x/dag",
  allergieen: ["graan"],
  specifiekeBehoeften: "Senior hond",
};

const validFormData = {
  animalId: "1",
  questionnaire: JSON.stringify(validQuestionnaire),
  notes: "Extra aandacht",
};

const createdPlan = {
  id: 1,
  animalId: 1,
  questionnaire: validQuestionnaire,
  notes: "Extra aandacht",
  updatedAt: new Date(),
};

describe("upsertFeedingPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockReturning.mockResolvedValue([createdPlan]);
    // Default: animal exists (1st select), no existing plan (2nd select)
    let selectCall = 0;
    mockSelectLimit.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return Promise.resolve([{ id: 1 }]); // animal exists
      return Promise.resolve([]); // no existing plan
    });
  });

  it("requires animal:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });

    const result = await upsertFeedingPlan(null, makeFormData(validFormData));

    expect(mockRequirePermission).toHaveBeenCalledWith("animal:write");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Onvoldoende rechten");
    }
  });

  it("returns fieldErrors when validation fails", async () => {
    const result = await upsertFeedingPlan(null, makeFormData({
      animalId: "1",
      questionnaire: JSON.stringify({ dieetType: "", hoeveelheid: "", frequentie: "" }),
    }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors!["questionnaire.dieetType"]).toBeDefined();
      expect(result.fieldErrors!["questionnaire.hoeveelheid"]).toBeDefined();
      expect(result.fieldErrors!["questionnaire.frequentie"]).toBeDefined();
    }
  });

  it("returns fieldErrors when questionnaire is invalid JSON", async () => {
    const result = await upsertFeedingPlan(null, makeFormData({
      animalId: "1",
      questionnaire: "not json",
    }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toBeDefined();
    }
  });

  it("returns fieldErrors when questionnaire is missing from FormData", async () => {
    const result = await upsertFeedingPlan(null, makeFormData({
      animalId: "1",
    }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toBeDefined();
    }
  });

  it("returns error when animal does not exist", async () => {
    mockSelectLimit.mockResolvedValueOnce([]); // animal not found

    const result = await upsertFeedingPlan(null, makeFormData(validFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Dier niet gevonden");
    }
  });

  it("creates feeding plan with correct values via upsert", async () => {
    const result = await upsertFeedingPlan(null, makeFormData(validFormData));

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("calls logAudit with create action when no existing plan", async () => {
    const result = await upsertFeedingPlan(null, makeFormData(validFormData));

    expect(result.success).toBe(true);
    expect(mockLogAudit).toHaveBeenCalledWith(
      "create_feeding_plan",
      "feeding_plan",
      1,
      null,
      expect.objectContaining({ id: 1 }),
    );
  });

  it("calls logAudit with update action and old value when plan exists", async () => {
    const existingPlan = { id: 1, animalId: 1, questionnaire: { dieetType: "natvoer" }, notes: null, updatedAt: new Date() };
    let selectCall = 0;
    mockSelectLimit.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return Promise.resolve([{ id: 1 }]); // animal exists
      return Promise.resolve([existingPlan]); // existing plan found
    });

    const result = await upsertFeedingPlan(null, makeFormData(validFormData));

    expect(result.success).toBe(true);
    expect(mockLogAudit).toHaveBeenCalledWith(
      "update_feeding_plan",
      "feeding_plan",
      1,
      existingPlan,
      expect.objectContaining({ id: 1 }),
    );
  });

  it("returns success with created plan data", async () => {
    const result = await upsertFeedingPlan(null, makeFormData(validFormData));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(expect.objectContaining({
        id: 1,
        animalId: 1,
        questionnaire: validQuestionnaire,
      }));
    }
  });

  it("revalidates the dieren path after upsert", async () => {
    await upsertFeedingPlan(null, makeFormData(validFormData));

    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren");
  });

  it("returns graceful error on DB failure", async () => {
    mockSelectLimit.mockRejectedValue(new Error("Connection refused"));

    const result = await upsertFeedingPlan(null, makeFormData(validFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it("handles plan without notes", async () => {
    const { notes: _, ...withoutNotes } = validFormData;
    const result = await upsertFeedingPlan(null, makeFormData(withoutNotes));

    expect(result.success).toBe(true);
  });
});
