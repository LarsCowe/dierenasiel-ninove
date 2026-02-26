import { describe, it, expect } from "vitest";
import { medicationSchema } from "./medications";

const validData = {
  animalId: "1",
  medicationName: "Amoxicilline",
  dosage: "2x daags 1 tablet",
  startDate: "2026-02-26",
};

describe("medicationSchema", () => {
  it("accepts a valid medication record", () => {
    const result = medicationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("coerces string animalId to number", () => {
    const result = medicationSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.animalId).toBe(1);
  });

  it("rejects missing animalId", () => {
    const result = medicationSchema.safeParse({ ...validData, animalId: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects zero animalId", () => {
    const result = medicationSchema.safeParse({ ...validData, animalId: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects negative animalId", () => {
    const result = medicationSchema.safeParse({ ...validData, animalId: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects empty medicationName", () => {
    const result = medicationSchema.safeParse({ ...validData, medicationName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects medicationName exceeding 200 characters", () => {
    const result = medicationSchema.safeParse({ ...validData, medicationName: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects empty dosage", () => {
    const result = medicationSchema.safeParse({ ...validData, dosage: "" });
    expect(result.success).toBe(false);
  });

  it("rejects dosage exceeding 100 characters", () => {
    const result = medicationSchema.safeParse({ ...validData, dosage: "x".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("accepts optional quantity", () => {
    const result = medicationSchema.safeParse({ ...validData, quantity: "30 tabletten" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.quantity).toBe("30 tabletten");
  });

  it("accepts undefined quantity", () => {
    const result = medicationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects quantity exceeding 100 characters", () => {
    const result = medicationSchema.safeParse({ ...validData, quantity: "x".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects empty startDate", () => {
    const result = medicationSchema.safeParse({ ...validData, startDate: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid startDate format", () => {
    const result = medicationSchema.safeParse({ ...validData, startDate: "not-a-date" });
    expect(result.success).toBe(false);
  });

  it("rejects startDate with wrong format (DD-MM-YYYY)", () => {
    const result = medicationSchema.safeParse({ ...validData, startDate: "26-02-2026" });
    expect(result.success).toBe(false);
  });

  it("accepts valid endDate", () => {
    const result = medicationSchema.safeParse({ ...validData, endDate: "2026-03-26" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.endDate).toBe("2026-03-26");
  });

  it("accepts empty string endDate", () => {
    const result = medicationSchema.safeParse({ ...validData, endDate: "" });
    expect(result.success).toBe(true);
  });

  it("accepts undefined endDate", () => {
    const result = medicationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects invalid endDate format", () => {
    const result = medicationSchema.safeParse({ ...validData, endDate: "not-a-date" });
    expect(result.success).toBe(false);
  });

  it("accepts optional notes", () => {
    const result = medicationSchema.safeParse({ ...validData, notes: "Na het eten" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.notes).toBe("Na het eten");
  });

  it("accepts undefined notes", () => {
    const result = medicationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects notes exceeding 2000 characters", () => {
    const result = medicationSchema.safeParse({ ...validData, notes: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });
});
