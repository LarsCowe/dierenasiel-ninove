import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockRequirePermission,
  mockInsertValues,
  mockInsertReturning,
  mockInsert,
  mockUpdateSet,
  mockUpdateWhere,
  mockUpdate,
  mockRevalidatePath,
} = vi.hoisted(() => {
  const mockRequirePermission = vi.fn();
  const mockInsertReturning = vi.fn();
  const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
  const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
  const mockRevalidatePath = vi.fn();
  return {
    mockRequirePermission,
    mockInsertValues,
    mockInsertReturning,
    mockInsert,
    mockUpdateSet,
    mockUpdateWhere,
    mockUpdate,
    mockRevalidatePath,
  };
});

vi.mock("@/lib/permissions", () => ({
  requirePermission: mockRequirePermission,
}));

vi.mock("@/lib/db", () => ({
  db: { insert: mockInsert, update: mockUpdate },
}));

vi.mock("@/lib/db/schema", () => ({
  blacklistEntries: Symbol("blacklistEntries"),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { createBlacklistEntry, updateBlacklistEntry, toggleBlacklistEntry } from "./blacklist";

describe("createBlacklistEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(null);
    mockInsertReturning.mockResolvedValue([{ id: 1 }]);
  });

  it("returns permission error when not authorized", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });

    const result = await createBlacklistEntry(null, new FormData());
    expect(result).toEqual({ success: false, error: "Onvoldoende rechten" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("creates entry with valid data", async () => {
    const fd = new FormData();
    fd.set("firstName", "Jan");
    fd.set("lastName", "Peeters");
    fd.set("address", "Kerkstraat 12");
    fd.set("reason", "Verwaarlozing");

    const result = await createBlacklistEntry(null, fd);
    expect(result.success).toBe(true);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Jan",
        lastName: "Peeters",
        address: "Kerkstraat 12",
        reason: "Verwaarlozing",
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalled();
  });

  it("returns validation errors for empty fields", async () => {
    const fd = new FormData();
    fd.set("firstName", "");
    fd.set("lastName", "");
    fd.set("reason", "");

    const result = await createBlacklistEntry(null, fd);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors).toBeDefined();
  });

  it("requires adoption:write permission", async () => {
    const fd = new FormData();
    fd.set("firstName", "Jan");
    fd.set("lastName", "Peeters");
    fd.set("reason", "Test");

    await createBlacklistEntry(null, fd);
    expect(mockRequirePermission).toHaveBeenCalledWith("adoption:write");
  });
});

describe("updateBlacklistEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(null);
  });

  it("updates entry with valid data", async () => {
    const fd = new FormData();
    fd.set("id", "1");
    fd.set("firstName", "Jan");
    fd.set("lastName", "Peeters");
    fd.set("address", "Nieuwe straat");
    fd.set("reason", "Geüpdatet");

    const result = await updateBlacklistEntry(null, fd);
    expect(result.success).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Jan",
        lastName: "Peeters",
        address: "Nieuwe straat",
        reason: "Geüpdatet",
      }),
    );
  });

  it("returns validation errors for invalid id", async () => {
    const fd = new FormData();
    fd.set("id", "0");
    fd.set("firstName", "Jan");
    fd.set("lastName", "Peeters");
    fd.set("reason", "Reden");

    const result = await updateBlacklistEntry(null, fd);
    expect(result.success).toBe(false);
  });
});

describe("toggleBlacklistEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(null);
  });

  it("toggles entry active status", async () => {
    const fd = new FormData();
    fd.set("json", JSON.stringify({ id: 1, isActive: false }));

    const result = await toggleBlacklistEntry(null, fd);
    expect(result.success).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });

  it("returns error for invalid id", async () => {
    const fd = new FormData();
    fd.set("json", JSON.stringify({ id: 0, isActive: true }));

    const result = await toggleBlacklistEntry(null, fd);
    expect(result.success).toBe(false);
  });

  it("returns error for invalid JSON", async () => {
    const fd = new FormData();
    fd.set("json", "not-valid-json{");

    const result = await toggleBlacklistEntry(null, fd);
    expect(result.success).toBe(false);
  });

  it("returns error when isActive is not boolean", async () => {
    const fd = new FormData();
    fd.set("json", JSON.stringify({ id: 1, isActive: "yes" }));

    const result = await toggleBlacklistEntry(null, fd);
    expect(result.success).toBe(false);
  });
});
