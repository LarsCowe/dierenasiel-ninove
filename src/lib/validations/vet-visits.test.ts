import { describe, it, expect } from "vitest";
import { vetVisitSchema, VET_VISIT_LOCATIONS } from "./vet-visits";

const validData = {
  animalId: "1",
  date: "2026-02-26",
  location: "in_asiel",
};

describe("vetVisitSchema", () => {
  it("accepts a valid vet visit record", () => {
    const result = vetVisitSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("coerces string animalId to number", () => {
    const result = vetVisitSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.animalId).toBe(1);
  });

  it("rejects missing animalId", () => {
    const result = vetVisitSchema.safeParse({ ...validData, animalId: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects zero animalId", () => {
    const result = vetVisitSchema.safeParse({ ...validData, animalId: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects empty date", () => {
    const result = vetVisitSchema.safeParse({ ...validData, date: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = vetVisitSchema.safeParse({ ...validData, date: "not-a-date" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid location", () => {
    const result = vetVisitSchema.safeParse({ ...validData, location: "thuis" });
    expect(result.success).toBe(false);
  });

  it.each(VET_VISIT_LOCATIONS)("accepts valid location: %s", (loc) => {
    const result = vetVisitSchema.safeParse({ ...validData, location: loc });
    expect(result.success).toBe(true);
  });

  it("accepts optional complaints", () => {
    const result = vetVisitSchema.safeParse({ ...validData, complaints: "Koorts" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.complaints).toBe("Koorts");
  });

  it("accepts optional todo", () => {
    const result = vetVisitSchema.safeParse({ ...validData, todo: "Bloedonderzoek" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.todo).toBe("Bloedonderzoek");
  });

  it("accepts optional notes", () => {
    const result = vetVisitSchema.safeParse({ ...validData, notes: "Opmerking" });
    expect(result.success).toBe(true);
  });

  it("rejects complaints exceeding 2000 characters", () => {
    const result = vetVisitSchema.safeParse({ ...validData, complaints: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("rejects todo exceeding 2000 characters", () => {
    const result = vetVisitSchema.safeParse({ ...validData, todo: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("rejects notes exceeding 2000 characters", () => {
    const result = vetVisitSchema.safeParse({ ...validData, notes: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });
});
