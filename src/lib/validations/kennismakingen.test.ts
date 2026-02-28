import { describe, it, expect } from "vitest";
import { kennismakingSchema, kennismakingOutcomeSchema } from "./kennismakingen";

const validKennismaking = {
  adoptionCandidateId: 1,
  animalId: 5,
  scheduledAt: "2026-03-10T14:00:00",
  location: "Bezoekruimte A",
};

describe("kennismakingSchema", () => {
  it("validates valid kennismaking", () => {
    const result = kennismakingSchema.safeParse(validKennismaking);
    expect(result.success).toBe(true);
  });

  it("requires adoptionCandidateId", () => {
    const result = kennismakingSchema.safeParse({ ...validKennismaking, adoptionCandidateId: undefined });
    expect(result.success).toBe(false);
  });

  it("requires animalId", () => {
    const result = kennismakingSchema.safeParse({ ...validKennismaking, animalId: undefined });
    expect(result.success).toBe(false);
  });

  it("requires scheduledAt", () => {
    const result = kennismakingSchema.safeParse({ ...validKennismaking, scheduledAt: "" });
    expect(result.success).toBe(false);
  });

  it("allows optional location", () => {
    const result = kennismakingSchema.safeParse({ ...validKennismaking, location: undefined });
    expect(result.success).toBe(true);
  });

  it("enforces location max 200 chars", () => {
    const result = kennismakingSchema.safeParse({ ...validKennismaking, location: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("coerces string animalId to number", () => {
    const result = kennismakingSchema.safeParse({ ...validKennismaking, animalId: "5" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.animalId).toBe(5);
  });

  it("coerces string adoptionCandidateId to number", () => {
    const result = kennismakingSchema.safeParse({ ...validKennismaking, adoptionCandidateId: "1" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.adoptionCandidateId).toBe(1);
  });
});

describe("kennismakingOutcomeSchema", () => {
  it("validates positief outcome", () => {
    const result = kennismakingOutcomeSchema.safeParse({ outcome: "positief", notes: "Goede match" });
    expect(result.success).toBe(true);
  });

  it("validates twijfel outcome", () => {
    const result = kennismakingOutcomeSchema.safeParse({ outcome: "twijfel", notes: "" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid outcome", () => {
    const result = kennismakingOutcomeSchema.safeParse({ outcome: "negatief", notes: "" });
    expect(result.success).toBe(false);
  });

  it("requires outcome field", () => {
    const result = kennismakingOutcomeSchema.safeParse({ notes: "test" });
    expect(result.success).toBe(false);
  });

  it("allows optional notes", () => {
    const result = kennismakingOutcomeSchema.safeParse({ outcome: "positief" });
    expect(result.success).toBe(true);
  });
});
