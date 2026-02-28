import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetSession, mockHasPermission, mockGetWorkflowSettings, mockLogAudit,
  mockRevalidatePath,
  mockUpdateWhere, mockUpdateSet, mockUpdate,
  mockInsertValues, mockInsert,
  mockSelectLimit, mockSelectWhere, mockSelectFrom,
} = vi.hoisted(() => {
  const mockGetSession = vi.fn();
  const mockHasPermission = vi.fn();
  const mockGetWorkflowSettings = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  const mockUpdateWhere = vi.fn();
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
  const mockInsertValues = vi.fn();
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  return {
    mockGetSession, mockHasPermission, mockGetWorkflowSettings, mockLogAudit,
    mockRevalidatePath,
    mockUpdateWhere, mockUpdateSet, mockUpdate,
    mockInsertValues, mockInsert,
    mockSelectLimit, mockSelectWhere, mockSelectFrom,
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
    select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  animals: {
    id: Symbol("animals.id"),
    workflowPhase: Symbol("animals.workflowPhase"),
  },
  animalWorkflowHistory: {
    animalId: Symbol("animalWorkflowHistory.animalId"),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("@/lib/permissions", () => ({
  hasPermission: mockHasPermission,
}));

vi.mock("@/lib/queries/shelter-settings", () => ({
  getWorkflowSettings: mockGetWorkflowSettings,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { transitionAnimalPhase } from "./workflow";

describe("transitionAnimalPhase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 1, role: "medewerker" });
    mockHasPermission.mockReturnValue(true);
    mockGetWorkflowSettings.mockResolvedValue({ workflowEnabled: true, stepbarVisible: true, autoActionsEnabled: true });
    mockSelectLimit.mockResolvedValue([{ id: 5, workflowPhase: "intake" }]);
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
    mockUpdateWhere.mockResolvedValue(undefined);
    mockInsertValues.mockResolvedValue(undefined);
  });

  // --- Auth & Permission ---

  it("returns error when not logged in", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await transitionAnimalPhase(5);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("niet ingelogd");
  });

  it("returns error when missing workflow:write permission", async () => {
    mockHasPermission.mockReturnValue(false);
    const result = await transitionAnimalPhase(5);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("rechten");
    expect(mockHasPermission).toHaveBeenCalledWith("medewerker", "workflow:write");
  });

  // --- Feature Toggle ---

  it("returns error when workflow_enabled is false", async () => {
    mockGetWorkflowSettings.mockResolvedValue({ workflowEnabled: false, stepbarVisible: true, autoActionsEnabled: true });
    const result = await transitionAnimalPhase(5);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("niet beschikbaar");
  });

  // --- Animal validation ---

  it("returns error when animal not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await transitionAnimalPhase(999);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("niet gevonden");
  });

  it("returns error when animal has no workflow phase", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 5, workflowPhase: null }]);
    const result = await transitionAnimalPhase(5);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("geen workflow-fase");
  });

  // --- Phase validation ---

  it("returns error for invalid workflow phase value", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 5, workflowPhase: "ongeldig" }]);
    const result = await transitionAnimalPhase(5);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Ongeldige");
  });

  it("returns error when animal is in terminal phase (afgerond)", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 5, workflowPhase: "afgerond" }]);
    const result = await transitionAnimalPhase(5);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("voltooid");
  });

  // --- Success path ---

  it("transitions from intake to registratie successfully", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 5, workflowPhase: "intake" }]);
    const result = await transitionAnimalPhase(5);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ fromPhase: "intake", toPhase: "registratie" });
    }
  });

  it("updates animal workflowPhase in database", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 5, workflowPhase: "intake" }]);
    await transitionAnimalPhase(5);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ workflowPhase: "registratie" }),
    );
  });

  it("creates workflow history record", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 5, workflowPhase: "registratie" }]);
    await transitionAnimalPhase(5, "Administratie afgerond");
    expect(mockInsert).toHaveBeenCalled();
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        animalId: 5,
        fromPhase: "registratie",
        toPhase: "medisch",
        changedBy: 1,
        changeReason: "Administratie afgerond",
      }),
    );
  });

  it("logs audit on success", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 5, workflowPhase: "intake" }]);
    await transitionAnimalPhase(5);
    expect(mockLogAudit).toHaveBeenCalledWith(
      "animal.workflow_phase_changed",
      "animal",
      5,
      expect.objectContaining({ workflowPhase: "intake" }),
      expect.objectContaining({ workflowPhase: "registratie" }),
    );
  });

  it("revalidates animal detail path", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 5, workflowPhase: "intake" }]);
    await transitionAnimalPhase(5);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren/5");
  });

  // --- Error handling ---

  it("returns error on phase update failure", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 5, workflowPhase: "intake" }]);
    mockUpdateWhere.mockRejectedValue(new Error("DB error"));
    const result = await transitionAnimalPhase(5);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("mis");
  });

  it("still succeeds when history insert fails (non-critical)", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 5, workflowPhase: "intake" }]);
    mockInsertValues.mockRejectedValue(new Error("History insert error"));
    const result = await transitionAnimalPhase(5);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ fromPhase: "intake", toPhase: "registratie" });
    }
  });
});
