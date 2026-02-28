import { describe, it, expect } from "vitest";
import { walkBookingSchema } from "./walks";

describe("walkBookingSchema", () => {
  const validInput = {
    animalId: "5",
    date: "2026-03-15",
    startTime: "10:00",
    remarks: "",
  };

  it("accepts valid booking input", () => {
    const result = walkBookingSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("coerces animalId string to number", () => {
    const result = walkBookingSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.animalId).toBe(5);
    }
  });

  it("rejects negative animalId", () => {
    const result = walkBookingSchema.safeParse({ ...validInput, animalId: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = walkBookingSchema.safeParse({ ...validInput, date: "15-03-2026" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid time format", () => {
    const result = walkBookingSchema.safeParse({ ...validInput, startTime: "10:0" });
    expect(result.success).toBe(false);
  });

  it("defaults remarks to empty string when omitted", () => {
    const { remarks, ...noRemarks } = validInput;
    const result = walkBookingSchema.safeParse(noRemarks);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.remarks).toBe("");
    }
  });
});
