import { describe, it, expect } from "vitest";
import { medicationLogSchema } from "./medication-logs";

const validData = {
  medicationId: "1",
};

describe("medicationLogSchema", () => {
  it("accepts valid medication log data", () => {
    const result = medicationLogSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("coerces string medicationId to number", () => {
    const result = medicationLogSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.medicationId).toBe(1);
  });

  it("rejects missing medicationId", () => {
    const result = medicationLogSchema.safeParse({ medicationId: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects zero medicationId", () => {
    const result = medicationLogSchema.safeParse({ medicationId: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects negative medicationId", () => {
    const result = medicationLogSchema.safeParse({ medicationId: "-1" });
    expect(result.success).toBe(false);
  });

  it("accepts optional notes", () => {
    const result = medicationLogSchema.safeParse({ ...validData, notes: "Goed ingenomen" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.notes).toBe("Goed ingenomen");
  });

  it("accepts undefined notes", () => {
    const result = medicationLogSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts empty string notes", () => {
    const result = medicationLogSchema.safeParse({ ...validData, notes: "" });
    expect(result.success).toBe(true);
  });

  it("rejects notes exceeding 2000 characters", () => {
    const result = medicationLogSchema.safeParse({ ...validData, notes: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });
});
