import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockRequirePermission,
  mockLogAudit,
  mockRevalidatePath,
  mockDel,
  mockSelectLimit,
  mockSelectWhere,
  mockSelectFrom,
  mockDeleteWhere,
  mockDelete,
  mockUpdateReturning,
  mockUpdateWhere,
  mockUpdateSet,
  mockUpdate,
  mockInsertValues,
  mockInsertReturning,
  mockInsert,
} = vi.hoisted(() => {
  const mockRequirePermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  const mockDel = vi.fn();

  // select chain: db.select().from().where().limit()
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });

  // delete chain: db.delete().where()
  const mockDeleteWhere = vi.fn();
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

  // update chain: db.update().set().where().returning()
  const mockUpdateReturning = vi.fn();
  const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning });
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

  // insert chain (for audit in setMainPhoto if needed)
  const mockInsertReturning = vi.fn();
  const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

  return {
    mockRequirePermission,
    mockLogAudit,
    mockRevalidatePath,
    mockDel,
    mockSelectLimit,
    mockSelectWhere,
    mockSelectFrom,
    mockDeleteWhere,
    mockDelete,
    mockUpdateReturning,
    mockUpdateWhere,
    mockUpdateSet,
    mockUpdate,
    mockInsertValues,
    mockInsertReturning,
    mockInsert,
  };
});

vi.mock("@/lib/permissions", () => ({
  requirePermission: mockRequirePermission,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@vercel/blob", () => ({
  del: mockDel,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
    delete: mockDelete,
    update: mockUpdate,
    insert: mockInsert,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  animalAttachments: Symbol("animalAttachments"),
  animals: Symbol("animals"),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));

import { deleteAttachment, setMainPhoto } from "./attachments";

const mockAttachment = {
  id: 1,
  animalId: 42,
  fileUrl: "https://blob.vercel-storage.com/animals/42/photo.jpg",
  fileName: "photo.jpg",
  fileType: "image/jpeg",
  context: "dossier",
  description: null,
  uploadedAt: new Date("2026-02-26"),
};

describe("deleteAttachment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockSelectLimit.mockResolvedValue([mockAttachment]);
    mockDeleteWhere.mockResolvedValue(undefined);
    mockDel.mockResolvedValue(undefined);
  });

  it("requires animal:write permission", async () => {
    mockRequirePermission.mockResolvedValue({
      success: false,
      error: "Onvoldoende rechten",
    });

    const result = await deleteAttachment(1);

    expect(mockRequirePermission).toHaveBeenCalledWith("animal:write");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Onvoldoende rechten");
    }
  });

  it("returns error when attachment not found", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await deleteAttachment(999);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("niet gevonden");
    }
  });

  it("deletes blob from Vercel Blob", async () => {
    await deleteAttachment(1);

    expect(mockDel).toHaveBeenCalledWith(mockAttachment.fileUrl);
  });

  it("deletes record from database", async () => {
    await deleteAttachment(1);

    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteWhere).toHaveBeenCalled();
  });

  it("logs audit after deletion", async () => {
    await deleteAttachment(1);

    expect(mockLogAudit).toHaveBeenCalledWith(
      "delete_attachment",
      "animal_attachment",
      1,
      mockAttachment,
      null,
    );
  });

  it("revalidates the animal detail path", async () => {
    await deleteAttachment(1);

    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren/42");
  });

  it("returns success on successful deletion", async () => {
    const result = await deleteAttachment(1);

    expect(result.success).toBe(true);
  });
});

describe("setMainPhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockSelectLimit.mockResolvedValue([mockAttachment]);
    mockUpdateReturning.mockResolvedValue([{ id: 42, imageUrl: mockAttachment.fileUrl }]);
  });

  it("requires animal:write permission", async () => {
    mockRequirePermission.mockResolvedValue({
      success: false,
      error: "Onvoldoende rechten",
    });

    const result = await setMainPhoto(1);

    expect(mockRequirePermission).toHaveBeenCalledWith("animal:write");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Onvoldoende rechten");
    }
  });

  it("returns error when attachment not found", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await setMainPhoto(999);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("niet gevonden");
    }
  });

  it("returns error when attachment is not an image", async () => {
    mockSelectLimit.mockResolvedValue([
      { ...mockAttachment, fileType: "application/pdf" },
    ]);

    const result = await setMainPhoto(1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("afbeelding");
    }
  });

  it("updates animals.imageUrl with attachment fileUrl", async () => {
    await setMainPhoto(1);

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: mockAttachment.fileUrl,
      }),
    );
  });

  it("logs audit after setting main photo", async () => {
    await setMainPhoto(1);

    expect(mockLogAudit).toHaveBeenCalledWith(
      "set_main_photo",
      "animal",
      42,
      expect.any(Object),
      expect.objectContaining({ imageUrl: mockAttachment.fileUrl }),
    );
  });

  it("revalidates the animal detail path", async () => {
    await setMainPhoto(1);

    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren/42");
  });

  it("returns success on successful update", async () => {
    const result = await setMainPhoto(1);

    expect(result.success).toBe(true);
  });
});
