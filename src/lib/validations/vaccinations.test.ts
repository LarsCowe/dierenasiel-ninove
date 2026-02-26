import { describe, it, expect } from "vitest";
import { vaccinationSchema } from "./vaccinations";

const validVaccination = {
  animalId: 1,
  type: "DHP" as const,
  date: "2026-02-26",
};

describe("vaccinationSchema", () => {
  it("accepts a valid vaccination with required fields", () => {
    const result = vaccinationSchema.safeParse(validVaccination);
    expect(result.success).toBe(true);
  });

  it("accepts with all optional fields", () => {
    const result = vaccinationSchema.safeParse({
      ...validVaccination,
      nextDueDate: "2027-02-26",
      notes: "Jaarlijkse booster",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when animalId is missing", () => {
    const { animalId: _, ...without } = validVaccination;
    const result = vaccinationSchema.safeParse(without);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.animalId).toBeDefined();
    }
  });

  it("coerces string animalId to number", () => {
    const result = vaccinationSchema.safeParse({ ...validVaccination, animalId: "5" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.animalId).toBe(5);
    }
  });

  it("rejects when date is empty", () => {
    const result = vaccinationSchema.safeParse({ ...validVaccination, date: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.date).toBeDefined();
    }
  });

  it("rejects invalid vaccination type", () => {
    const result = vaccinationSchema.safeParse({ ...validVaccination, type: "Rabiës" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.type).toBeDefined();
    }
  });

  it("accepts type DHP", () => {
    const result = vaccinationSchema.safeParse({ ...validVaccination, type: "DHP" });
    expect(result.success).toBe(true);
  });

  it("accepts type Kennelhoest", () => {
    const result = vaccinationSchema.safeParse({ ...validVaccination, type: "Kennelhoest" });
    expect(result.success).toBe(true);
  });

  it("accepts type L4", () => {
    const result = vaccinationSchema.safeParse({ ...validVaccination, type: "L4" });
    expect(result.success).toBe(true);
  });

  it("allows notes to be omitted", () => {
    const result = vaccinationSchema.safeParse(validVaccination);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeUndefined();
    }
  });

  it("allows nextDueDate to be omitted", () => {
    const result = vaccinationSchema.safeParse(validVaccination);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nextDueDate).toBeUndefined();
    }
  });
});
