import { describe, it, expect } from "vitest";
import { neglectReportSchema } from "./neglect-reports";

const validReport = {
  animalId: 1,
  healthStatusOnArrival: "Ernstig ondervoed, uitgedroogd",
  neglectFindings: "Langdurige verwaarlozing, geen voer of water aanwezig",
};

describe("neglectReportSchema", () => {
  it("accepts a valid report with required fields only", () => {
    const result = neglectReportSchema.safeParse(validReport);
    expect(result.success).toBe(true);
  });

  it("accepts a complete report with all optional fields", () => {
    const result = neglectReportSchema.safeParse({
      ...validReport,
      date: "2026-02-26",
      vetName: "Dr. Janssens",
      treatmentsGiven: "Infuus, voeding, warmte",
      weightOnArrival: "4.5 kg",
      photos: ["https://blob.vercel-storage.com/photo1.jpg", "https://blob.vercel-storage.com/photo2.jpg"],
      notes: "Dier was erg angstig",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when healthStatusOnArrival is missing", () => {
    const { healthStatusOnArrival: _, ...without } = validReport;
    const result = neglectReportSchema.safeParse(without);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.healthStatusOnArrival).toBeDefined();
    }
  });

  it("rejects when healthStatusOnArrival is empty string", () => {
    const result = neglectReportSchema.safeParse({ ...validReport, healthStatusOnArrival: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.healthStatusOnArrival).toBeDefined();
    }
  });

  it("rejects when neglectFindings is missing", () => {
    const { neglectFindings: _, ...without } = validReport;
    const result = neglectReportSchema.safeParse(without);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.neglectFindings).toBeDefined();
    }
  });

  it("rejects when neglectFindings is empty string", () => {
    const result = neglectReportSchema.safeParse({ ...validReport, neglectFindings: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.neglectFindings).toBeDefined();
    }
  });

  it("rejects when animalId is missing", () => {
    const { animalId: _, ...without } = validReport;
    const result = neglectReportSchema.safeParse(without);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.animalId).toBeDefined();
    }
  });

  it("coerces string animalId to number", () => {
    const result = neglectReportSchema.safeParse({ ...validReport, animalId: "5" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.animalId).toBe(5);
    }
  });

  it("accepts photos as string array", () => {
    const result = neglectReportSchema.safeParse({
      ...validReport,
      photos: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.photos).toHaveLength(2);
    }
  });

  it("accepts empty photos array", () => {
    const result = neglectReportSchema.safeParse({ ...validReport, photos: [] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.photos).toEqual([]);
    }
  });

  it("allows all optional fields to be omitted", () => {
    const result = neglectReportSchema.safeParse(validReport);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBeUndefined();
      expect(result.data.vetName).toBeUndefined();
      expect(result.data.treatmentsGiven).toBeUndefined();
      expect(result.data.weightOnArrival).toBeUndefined();
      expect(result.data.photos).toBeUndefined();
      expect(result.data.notes).toBeUndefined();
    }
  });
});
