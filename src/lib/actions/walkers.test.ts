import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockReturning, mockValues, mockInsert,
  mockUpdateReturning, mockUpdateWhere, mockUpdateSet, mockUpdate,
  mockSelectWhere, mockSelectFrom, mockSelect,
  mockSelectLimit,
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
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });
  const mockRequirePermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  return {
    mockReturning, mockValues, mockInsert,
    mockUpdateReturning, mockUpdateWhere, mockUpdateSet, mockUpdate,
    mockSelectWhere, mockSelectFrom, mockSelect,
    mockSelectLimit,
    mockRequirePermission, mockLogAudit, mockRevalidatePath,
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
    select: mockSelect,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  walkers: {
    id: Symbol("walkers.id"),
    email: Symbol("walkers.email"),
    status: Symbol("walkers.status"),
  },
}));

vi.mock("@/lib/permissions", () => ({
  requirePermission: mockRequirePermission,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import { submitWalkerRegistration, updateWalkerStatus } from "./walkers";

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value);
  }
  return fd;
}

const validFormFields = {
  firstName: "Jan",
  lastName: "Janssens",
  email: "jan@example.com",
  phone: "0471234567",
  dateOfBirth: "2000-01-15",
  address: "Kerkstraat 1, 9400 Ninove",
  allergies: "",
  childrenWalkAlong: "false",
  regulationsRead: "true",
  photoUrl: "",
};

const insertedWalker = {
  id: 42,
  firstName: "Jan",
  lastName: "Janssens",
  email: "jan@example.com",
  phone: "0471234567",
  dateOfBirth: "2000-01-15",
  address: "Kerkstraat 1, 9400 Ninove",
  allergies: "",
  childrenWalkAlong: false,
  regulationsRead: true,
  barcode: null,
  photoUrl: null,
  isApproved: false,
  walkCount: 0,
  isWalkingClubMember: false,
  status: "pending",
  createdAt: new Date(),
};

describe("submitWalkerRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([insertedWalker]);
    // submitWalkerRegistration calls select().from().where() without .limit()
    mockSelectWhere.mockResolvedValue([]);
    mockUpdateReturning.mockResolvedValue([{ ...insertedWalker, barcode: "WLK-42" }]);
  });

  it("returns fieldErrors when validation fails (missing firstName)", async () => {
    const result = await submitWalkerRegistration(null, makeFormData({ ...validFormFields, firstName: "" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.firstName).toBeDefined();
    }
  });

  it("returns error when regulationsRead is false (AC3)", async () => {
    const result = await submitWalkerRegistration(null, makeFormData({ ...validFormFields, regulationsRead: "false" }));
    expect(result.success).toBe(false);
  });

  it("returns error when person is under 18", async () => {
    const today = new Date();
    const underAge = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
    const dob = underAge.toISOString().split("T")[0];
    const result = await submitWalkerRegistration(null, makeFormData({ ...validFormFields, dateOfBirth: dob }));
    expect(result.success).toBe(false);
  });

  it("checks for duplicate email before insert", async () => {
    mockSelectWhere.mockResolvedValue([{ id: 1, email: "jan@example.com" }]);

    const result = await submitWalkerRegistration(null, makeFormData(validFormFields));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("e-mailadres");
    }
  });

  it("inserts walker with correct values", async () => {
    await submitWalkerRegistration(null, makeFormData(validFormFields));

    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Jan",
        lastName: "Janssens",
        email: "jan@example.com",
        status: "pending",
        isApproved: false,
      }),
    );
  });

  it("generates barcode WLK-{id} after insert", async () => {
    await submitWalkerRegistration(null, makeFormData(validFormFields));

    expect(mockUpdateSet).toHaveBeenCalledWith({ barcode: "WLK-42" });
  });

  it("returns success with walker data including barcode", async () => {
    const result = await submitWalkerRegistration(null, makeFormData(validFormFields));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.barcode).toBe("WLK-42");
      expect(result.message).toBeDefined();
    }
  });

  it("passes photoUrl when provided", async () => {
    await submitWalkerRegistration(null, makeFormData({
      ...validFormFields,
      photoUrl: "https://example.com/photo.jpg",
    }));

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        photoUrl: "https://example.com/photo.jpg",
      }),
    );
  });

  it("handles childrenWalkAlong as true", async () => {
    await submitWalkerRegistration(null, makeFormData({
      ...validFormFields,
      childrenWalkAlong: "true",
    }));

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        childrenWalkAlong: true,
      }),
    );
  });

  it("returns error when database insert fails", async () => {
    mockReturning.mockRejectedValue(new Error("DB error"));

    const result = await submitWalkerRegistration(null, makeFormData(validFormFields));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});

const existingWalker = {
  id: 1,
  firstName: "Jan",
  lastName: "Janssens",
  email: "jan@example.com",
  phone: "0471234567",
  dateOfBirth: "2000-01-15",
  address: "Kerkstraat 1",
  allergies: null,
  childrenWalkAlong: false,
  regulationsRead: true,
  barcode: "WLK-1",
  photoUrl: null,
  isApproved: false,
  walkCount: 0,
  isWalkingClubMember: false,
  status: "pending",
  rejectionReason: null,
  createdAt: new Date(),
};

describe("updateWalkerStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    // getWalkerById chain: select().from().where().limit()
    mockSelectLimit.mockResolvedValue([existingWalker]);
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });
    mockUpdateReturning.mockResolvedValue([{ ...existingWalker, status: "approved", isApproved: true }]);
  });

  it("requires walker:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });

    const result = await updateWalkerStatus(null, makeFormData({ walkerId: "1", status: "approved" }));

    expect(mockRequirePermission).toHaveBeenCalledWith("walker:write");
    expect(result.success).toBe(false);
  });

  it("returns error when walker not found", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await updateWalkerStatus(null, makeFormData({ walkerId: "1", status: "approved" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("niet gevonden");
    }
  });

  it("returns fieldErrors when validation fails (invalid status)", async () => {
    const result = await updateWalkerStatus(null, makeFormData({ walkerId: "1", status: "invalid" }));

    expect(result.success).toBe(false);
  });

  it("rejects rejected status without reason", async () => {
    const result = await updateWalkerStatus(null, makeFormData({
      walkerId: "1",
      status: "rejected",
      rejectionReason: "",
    }));

    expect(result.success).toBe(false);
  });

  it("approves walker with correct updates", async () => {
    await updateWalkerStatus(null, makeFormData({ walkerId: "1", status: "approved" }));

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approved",
        isApproved: true,
      }),
    );
  });

  it("rejects walker with reason", async () => {
    mockUpdateReturning.mockResolvedValue([{ ...existingWalker, status: "rejected", rejectionReason: "Te jong" }]);

    await updateWalkerStatus(null, makeFormData({
      walkerId: "1",
      status: "rejected",
      rejectionReason: "Te jong",
    }));

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "rejected",
        isApproved: false,
        rejectionReason: "Te jong",
      }),
    );
  });

  it("sets inactive with isApproved false", async () => {
    mockUpdateReturning.mockResolvedValue([{ ...existingWalker, status: "inactive", isApproved: false }]);

    await updateWalkerStatus(null, makeFormData({ walkerId: "1", status: "inactive" }));

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "inactive",
        isApproved: false,
      }),
    );
  });

  it("logs audit on status change", async () => {
    await updateWalkerStatus(null, makeFormData({ walkerId: "1", status: "approved" }));

    expect(mockLogAudit).toHaveBeenCalledWith(
      "walker.approved",
      "walker",
      1,
      expect.objectContaining({ status: "pending" }),
      expect.objectContaining({ status: "approved" }),
    );
  });

  it("revalidates wandelaars path", async () => {
    await updateWalkerStatus(null, makeFormData({ walkerId: "1", status: "approved" }));

    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/wandelaars");
  });

  it("returns error when database update fails", async () => {
    mockUpdateReturning.mockRejectedValue(new Error("DB error"));

    const result = await updateWalkerStatus(null, makeFormData({ walkerId: "1", status: "approved" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});
