import { describe, it, expect } from "vitest";
import { uploadAttachmentSchema, deleteAttachmentSchema } from "./attachments";

describe("uploadAttachmentSchema", () => {
  const validUpload = {
    animalId: 1,
    fileType: "image/jpeg",
    fileName: "foto.jpg",
  };

  it("accepts a valid upload with required fields", () => {
    const result = uploadAttachmentSchema.safeParse(validUpload);
    expect(result.success).toBe(true);
  });

  it("accepts upload with optional description", () => {
    const result = uploadAttachmentSchema.safeParse({
      ...validUpload,
      description: "Foto na adoptie",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("Foto na adoptie");
    }
  });

  it("rejects when animalId is missing", () => {
    const { animalId: _, ...without } = validUpload;
    const result = uploadAttachmentSchema.safeParse(without);
    expect(result.success).toBe(false);
  });

  it("rejects when animalId is not positive", () => {
    const result = uploadAttachmentSchema.safeParse({ ...validUpload, animalId: 0 });
    expect(result.success).toBe(false);
  });

  it("coerces string animalId to number", () => {
    const result = uploadAttachmentSchema.safeParse({ ...validUpload, animalId: "5" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.animalId).toBe(5);
    }
  });

  it("rejects when fileName is missing", () => {
    const { fileName: _, ...without } = validUpload;
    const result = uploadAttachmentSchema.safeParse(without);
    expect(result.success).toBe(false);
  });

  it("rejects when fileName is empty", () => {
    const result = uploadAttachmentSchema.safeParse({ ...validUpload, fileName: "" });
    expect(result.success).toBe(false);
  });

  // Image MIME types
  it("accepts image/jpeg", () => {
    const result = uploadAttachmentSchema.safeParse({ ...validUpload, fileType: "image/jpeg" });
    expect(result.success).toBe(true);
  });

  it("accepts image/png", () => {
    const result = uploadAttachmentSchema.safeParse({ ...validUpload, fileType: "image/png" });
    expect(result.success).toBe(true);
  });

  it("accepts image/gif", () => {
    const result = uploadAttachmentSchema.safeParse({ ...validUpload, fileType: "image/gif" });
    expect(result.success).toBe(true);
  });

  it("accepts image/webp", () => {
    const result = uploadAttachmentSchema.safeParse({ ...validUpload, fileType: "image/webp" });
    expect(result.success).toBe(true);
  });

  // Video MIME types
  it("accepts video/mp4", () => {
    const result = uploadAttachmentSchema.safeParse({ ...validUpload, fileType: "video/mp4" });
    expect(result.success).toBe(true);
  });

  it("accepts video/quicktime", () => {
    const result = uploadAttachmentSchema.safeParse({ ...validUpload, fileType: "video/quicktime" });
    expect(result.success).toBe(true);
  });

  it("accepts video/webm", () => {
    const result = uploadAttachmentSchema.safeParse({ ...validUpload, fileType: "video/webm" });
    expect(result.success).toBe(true);
  });

  // Document MIME types
  it("accepts application/pdf", () => {
    const result = uploadAttachmentSchema.safeParse({ ...validUpload, fileType: "application/pdf" });
    expect(result.success).toBe(true);
  });

  // Rejected MIME types
  it("rejects application/exe", () => {
    const result = uploadAttachmentSchema.safeParse({ ...validUpload, fileType: "application/exe" });
    expect(result.success).toBe(false);
  });

  it("rejects text/html", () => {
    const result = uploadAttachmentSchema.safeParse({ ...validUpload, fileType: "text/html" });
    expect(result.success).toBe(false);
  });

  it("rejects application/zip", () => {
    const result = uploadAttachmentSchema.safeParse({ ...validUpload, fileType: "application/zip" });
    expect(result.success).toBe(false);
  });

  it("rejects empty fileType", () => {
    const result = uploadAttachmentSchema.safeParse({ ...validUpload, fileType: "" });
    expect(result.success).toBe(false);
  });
});

describe("deleteAttachmentSchema", () => {
  it("accepts a valid id", () => {
    const result = deleteAttachmentSchema.safeParse({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("coerces string id to number", () => {
    const result = deleteAttachmentSchema.safeParse({ id: "42" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(42);
    }
  });

  it("rejects when id is missing", () => {
    const result = deleteAttachmentSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects when id is not positive", () => {
    const result = deleteAttachmentSchema.safeParse({ id: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative id", () => {
    const result = deleteAttachmentSchema.safeParse({ id: -1 });
    expect(result.success).toBe(false);
  });
});
