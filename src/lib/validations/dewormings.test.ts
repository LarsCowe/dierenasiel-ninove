import { describe, it, expect } from "vitest";
import { dewormingSchema } from "./dewormings";

const validDeworming = {
  animalId: 1,
  type: "Canicantel" as const,
  date: "2026-02-26",
};

describe("dewormingSchema", () => {
  it("accepts a valid deworming with required fields", () => {
    const result = dewormingSchema.safeParse(validDeworming);
    expect(result.success).toBe(true);
  });

  it("accepts with optional notes", () => {
    const result = dewormingSchema.safeParse({
      ...validDeworming,
      notes: "Preventieve behandeling",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when animalId is missing", () => {
    const { animalId: _, ...without } = validDeworming;
    const result = dewormingSchema.safeParse(without);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.animalId).toBeDefined();
    }
  });

  it("coerces string animalId to number", () => {
    const result = dewormingSchema.safeParse({ ...validDeworming, animalId: "3" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.animalId).toBe(3);
    }
  });

  it("rejects when date is empty", () => {
    const result = dewormingSchema.safeParse({ ...validDeworming, date: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.date).toBeDefined();
    }
  });

  it("rejects invalid deworming type", () => {
    const result = dewormingSchema.safeParse({ ...validDeworming, type: "Andere" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.type).toBeDefined();
    }
  });

  it("accepts type Canicantel", () => {
    const result = dewormingSchema.safeParse({ ...validDeworming, type: "Canicantel" });
    expect(result.success).toBe(true);
  });

  it("accepts type Dogninth", () => {
    const result = dewormingSchema.safeParse({ ...validDeworming, type: "Dogninth" });
    expect(result.success).toBe(true);
  });

  it("accepts type Catminth", () => {
    const result = dewormingSchema.safeParse({ ...validDeworming, type: "Catminth" });
    expect(result.success).toBe(true);
  });

  it("allows notes to be omitted", () => {
    const result = dewormingSchema.safeParse(validDeworming);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeUndefined();
    }
  });
});
