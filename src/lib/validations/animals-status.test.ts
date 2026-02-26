import { describe, it, expect } from "vitest";
import {
  changeStatusSchema,
  registerOuttakeSchema,
  ANIMAL_STATUSES,
  OUTTAKE_REASONS,
} from "./animals-status";

describe("ANIMAL_STATUSES", () => {
  it("contains all valid status values", () => {
    expect(ANIMAL_STATUSES).toEqual([
      "beschikbaar",
      "in_behandeling",
      "gereserveerd",
      "geadopteerd",
      "terug_eigenaar",
      "geeuthanaseerd",
    ]);
  });
});

describe("OUTTAKE_REASONS", () => {
  it("contains all valid outtake reasons", () => {
    expect(OUTTAKE_REASONS).toEqual([
      "adoptie",
      "terug_eigenaar",
      "euthanasie",
    ]);
  });
});

describe("changeStatusSchema", () => {
  it("accepts valid status change", () => {
    const result = changeStatusSchema.safeParse({
      animalId: 1,
      newStatus: "in_behandeling",
    });
    expect(result.success).toBe(true);
  });

  it("coerces animalId from string", () => {
    const result = changeStatusSchema.safeParse({
      animalId: "5",
      newStatus: "beschikbaar",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.animalId).toBe(5);
  });

  it("rejects invalid status value", () => {
    const result = changeStatusSchema.safeParse({
      animalId: 1,
      newStatus: "onbekend",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when animalId is missing", () => {
    const result = changeStatusSchema.safeParse({
      newStatus: "beschikbaar",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when animalId is zero", () => {
    const result = changeStatusSchema.safeParse({
      animalId: 0,
      newStatus: "beschikbaar",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid statuses", () => {
    for (const status of ANIMAL_STATUSES) {
      const result = changeStatusSchema.safeParse({
        animalId: 1,
        newStatus: status,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("registerOuttakeSchema", () => {
  it("accepts valid outtake with adoptie reason", () => {
    const result = registerOuttakeSchema.safeParse({
      animalId: 1,
      outtakeReason: "adoptie",
      outtakeDate: "2026-02-26",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid outtake with terug_eigenaar reason", () => {
    const result = registerOuttakeSchema.safeParse({
      animalId: 2,
      outtakeReason: "terug_eigenaar",
      outtakeDate: "2026-01-15",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid outtake with euthanasie reason", () => {
    const result = registerOuttakeSchema.safeParse({
      animalId: 3,
      outtakeReason: "euthanasie",
      outtakeDate: "2026-02-20",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid outtake reason", () => {
    const result = registerOuttakeSchema.safeParse({
      animalId: 1,
      outtakeReason: "weggelopen",
      outtakeDate: "2026-02-26",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when outtakeDate is missing", () => {
    const result = registerOuttakeSchema.safeParse({
      animalId: 1,
      outtakeReason: "adoptie",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when outtakeReason is missing", () => {
    const result = registerOuttakeSchema.safeParse({
      animalId: 1,
      outtakeDate: "2026-02-26",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when animalId is zero", () => {
    const result = registerOuttakeSchema.safeParse({
      animalId: 0,
      outtakeReason: "adoptie",
      outtakeDate: "2026-02-26",
    });
    expect(result.success).toBe(false);
  });

  it("coerces animalId from string", () => {
    const result = registerOuttakeSchema.safeParse({
      animalId: "10",
      outtakeReason: "adoptie",
      outtakeDate: "2026-02-26",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.animalId).toBe(10);
  });

  it("rejects empty outtakeDate string", () => {
    const result = registerOuttakeSchema.safeParse({
      animalId: 1,
      outtakeReason: "adoptie",
      outtakeDate: "",
    });
    expect(result.success).toBe(false);
  });
});
