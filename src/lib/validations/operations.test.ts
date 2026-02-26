import { describe, it, expect } from "vitest";
import { operationSchema, OPERATION_TYPES } from "./operations";

const validData = {
  animalId: "1",
  type: "steriliseren",
  date: "2026-02-26",
};

describe("operationSchema", () => {
  it("accepts a valid operation record", () => {
    const result = operationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("coerces string animalId to number", () => {
    const result = operationSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.animalId).toBe(1);
  });

  it("rejects missing animalId", () => {
    const result = operationSchema.safeParse({ ...validData, animalId: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects zero animalId", () => {
    const result = operationSchema.safeParse({ ...validData, animalId: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects negative animalId", () => {
    const result = operationSchema.safeParse({ ...validData, animalId: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects empty date", () => {
    const result = operationSchema.safeParse({ ...validData, date: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = operationSchema.safeParse({ ...validData, date: "not-a-date" });
    expect(result.success).toBe(false);
  });

  it("rejects date with wrong format (DD-MM-YYYY)", () => {
    const result = operationSchema.safeParse({ ...validData, date: "26-02-2026" });
    expect(result.success).toBe(false);
  });

  it.each(OPERATION_TYPES)("accepts valid type: %s", (type) => {
    const result = operationSchema.safeParse({ ...validData, type });
    expect(result.success).toBe(true);
  });

  it("rejects invalid type", () => {
    const result = operationSchema.safeParse({ ...validData, type: "onbekend" });
    expect(result.success).toBe(false);
  });

  it("accepts optional notes", () => {
    const result = operationSchema.safeParse({ ...validData, notes: "Verliep goed" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.notes).toBe("Verliep goed");
  });

  it("accepts undefined notes", () => {
    const result = operationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects notes exceeding 2000 characters", () => {
    const result = operationSchema.safeParse({ ...validData, notes: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });
});
