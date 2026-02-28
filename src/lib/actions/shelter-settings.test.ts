import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetSession, mockLogAudit, mockRevalidatePath,
  mockOnConflictDoUpdate, mockInsertValues, mockInsert,
} = vi.hoisted(() => {
  const mockGetSession = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  const mockOnConflictDoUpdate = vi.fn();
  const mockInsertValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
  return {
    mockGetSession, mockLogAudit, mockRevalidatePath,
    mockOnConflictDoUpdate, mockInsertValues, mockInsert,
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    insert: mockInsert,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  shelterSettings: {
    key: Symbol("shelterSettings.key"),
    value: Symbol("shelterSettings.value"),
    updatedAt: Symbol("shelterSettings.updatedAt"),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { updateWalkingClubThreshold } from "./shelter-settings";

describe("updateWalkingClubThreshold", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 1, role: "admin" });
    mockOnConflictDoUpdate.mockResolvedValue(undefined);
  });

  it("returns error when not logged in", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await updateWalkingClubThreshold(15);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("niet ingelogd");
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

  it("upserts threshold successfully", async () => {
    const result = await updateWalkingClubThreshold(15);
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ key: "walking_club_threshold", value: "15" }),
    );
    expect(mockOnConflictDoUpdate).toHaveBeenCalled();
  });

  it("logs audit on success", async () => {
    await updateWalkingClubThreshold(15);
    expect(mockLogAudit).toHaveBeenCalledWith(
      "settings.walking_club_threshold_updated",
      "setting",
      0,
      null,
      expect.objectContaining({ value: "15" }),
    );
  });

  it("revalidates path on success", async () => {
    await updateWalkingClubThreshold(15);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/wandelaars");
  });
});
