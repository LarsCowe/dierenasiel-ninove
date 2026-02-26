import { describe, it, expect } from "vitest";
import { assignKennelSchema } from "./kennels";

describe("assignKennelSchema", () => {
  it("accepts valid animalId and kennelId", () => {
    const result = assignKennelSchema.safeParse({ animalId: 1, kennelId: 2 });
    expect(result.success).toBe(true);
  });

  it("coerces string ids to numbers", () => {
    const result = assignKennelSchema.safeParse({ animalId: "1", kennelId: "2" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.animalId).toBe(1);
      expect(result.data.kennelId).toBe(2);
    }
  });

  it("accepts null kennelId to unassign", () => {
    const result = assignKennelSchema.safeParse({ animalId: 1, kennelId: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kennelId).toBeNull();
    }
  });

  it("rejects when animalId is missing", () => {
    const result = assignKennelSchema.safeParse({ kennelId: 2 });
    expect(result.success).toBe(false);
  });

  it("rejects when animalId is not positive", () => {
    const result = assignKennelSchema.safeParse({ animalId: 0, kennelId: 2 });
    expect(result.success).toBe(false);
  });

  it("rejects when kennelId is not positive (and not null)", () => {
    const result = assignKennelSchema.safeParse({ animalId: 1, kennelId: 0 });
    expect(result.success).toBe(false);
  });
});
