import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetSession, mockHasPermission, mockLogAudit, mockRevalidatePath,
  mockOnConflictDoUpdate, mockInsertValues, mockInsert,
  mockSelectLimit, mockSelectWhere, mockSelectFrom,
} = vi.hoisted(() => {
  const mockGetSession = vi.fn();
  const mockHasPermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  const mockOnConflictDoUpdate = vi.fn();
  const mockInsertValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  return {
    mockGetSession, mockHasPermission, mockLogAudit, mockRevalidatePath,
    mockOnConflictDoUpdate, mockInsertValues, mockInsert,
    mockSelectLimit, mockSelectWhere, mockSelectFrom,
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    insert: mockInsert,
    select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  shelterSettings: {
    key: Symbol("shelterSettings.key"),
    value: Symbol("shelterSettings.value"),
    updatedAt: Symbol("shelterSettings.updatedAt"),
    updatedBy: Symbol("shelterSettings.updatedBy"),
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

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { updateShelterSetting, updateWalkingClubThreshold } from "./shelter-settings";

describe("updateShelterSetting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 1, role: "beheerder" });
    mockHasPermission.mockReturnValue(true);
    mockOnConflictDoUpdate.mockResolvedValue(undefined);
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
    mockSelectLimit.mockResolvedValue([]);
  });

  it("returns error when not logged in", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await updateShelterSetting("workflow_enabled", true);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("niet ingelogd");
  });

  it("returns error when missing settings:write permission", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "medewerker" });
    mockHasPermission.mockReturnValue(false);
    const result = await updateShelterSetting("workflow_enabled", true);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("rechten");
    expect(mockHasPermission).toHaveBeenCalledWith("medewerker", "settings:write");
  });

  it("returns error for invalid key", async () => {
    const result = await updateShelterSetting("invalid_key", true);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Onbekende");
  });

  it("returns error for invalid value type (string for boolean setting)", async () => {
    const result = await updateShelterSetting("workflow_enabled", "true");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("boolean");
  });

  it("updates workflow_enabled successfully", async () => {
    mockSelectLimit.mockResolvedValue([{ key: "workflow_enabled", value: true }]);
    const result = await updateShelterSetting("workflow_enabled", false);
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ key: "workflow_enabled", value: false }),
    );
  });

  it("updates workflow_stepbar_visible successfully", async () => {
    const result = await updateShelterSetting("workflow_stepbar_visible", false);
    expect(result.success).toBe(true);
  });

  it("updates workflow_auto_actions_enabled successfully", async () => {
    const result = await updateShelterSetting("workflow_auto_actions_enabled", false);
    expect(result.success).toBe(true);
  });

  it("logs audit with old and new value", async () => {
    mockSelectLimit.mockResolvedValue([{ key: "workflow_enabled", value: true }]);
    await updateShelterSetting("workflow_enabled", false);
    expect(mockLogAudit).toHaveBeenCalledWith(
      "settings.workflow_enabled_updated",
      "shelter_setting",
      "workflow_enabled",
      expect.objectContaining({ value: true }),
      expect.objectContaining({ value: false }),
    );
  });

  it("revalidates instellingen path on success", async () => {
    await updateShelterSetting("workflow_enabled", false);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/instellingen");
  });

  it("returns error on DB failure", async () => {
    mockOnConflictDoUpdate.mockRejectedValue(new Error("DB error"));
    const result = await updateShelterSetting("workflow_enabled", false);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("mis");
  });
});

describe("updateWalkingClubThreshold", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 1, role: "beheerder" });
    mockOnConflictDoUpdate.mockResolvedValue(undefined);
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
    mockSelectLimit.mockResolvedValue([]);
  });

  it("returns error when not admin/coordinator", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "wandelaar" });
    const result = await updateWalkingClubThreshold(15);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("rechten");
  });

  it("returns error for invalid threshold (zero)", async () => {
    const result = await updateWalkingClubThreshold(0);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("positief");
  });

  it("returns error for invalid threshold (negative)", async () => {
    const result = await updateWalkingClubThreshold(-5);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("positief");
  });

  it("upserts threshold as jsonb number", async () => {
    const result = await updateWalkingClubThreshold(15);
    expect(result.success).toBe(true);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ key: "walking_club_threshold", value: 15 }),
    );
  });

  it("allows coordinator role", async () => {
    mockGetSession.mockResolvedValue({ userId: 2, role: "coordinator" });
    const result = await updateWalkingClubThreshold(20);
    expect(result.success).toBe(true);
  });

  it("logs audit on success", async () => {
    await updateWalkingClubThreshold(15);
    expect(mockLogAudit).toHaveBeenCalledWith(
      "settings.walking_club_threshold_updated",
      "shelter_setting",
      "walking_club_threshold",
      null,
      expect.objectContaining({ value: 15 }),
    );
  });

  it("revalidates wandelaars path on success", async () => {
    await updateWalkingClubThreshold(15);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/wandelaars");
  });
});
