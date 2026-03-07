import { describe, it, expect } from "vitest";
import { createBlacklistEntrySchema, updateBlacklistEntrySchema } from "./blacklist";

describe("createBlacklistEntrySchema", () => {
  it("accepts valid input with all fields", () => {
    const result = createBlacklistEntrySchema.safeParse({
      firstName: "Jan",
      lastName: "Peeters",
      address: "Kerkstraat 12, 9400 Ninove",
      reason: "Eerder geweigerd wegens verwaarlozing",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input without address", () => {
    const result = createBlacklistEntrySchema.safeParse({
      firstName: "Jan",
      lastName: "Peeters",
      reason: "Eerder geweigerd",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty firstName", () => {
    const result = createBlacklistEntrySchema.safeParse({
      firstName: "",
      lastName: "Peeters",
      reason: "Eerder geweigerd",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty lastName", () => {
    const result = createBlacklistEntrySchema.safeParse({
      firstName: "Jan",
      lastName: "",
      reason: "Eerder geweigerd",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty reason", () => {
    const result = createBlacklistEntrySchema.safeParse({
      firstName: "Jan",
      lastName: "Peeters",
      reason: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing firstName", () => {
    const result = createBlacklistEntrySchema.safeParse({
      lastName: "Peeters",
      reason: "Reden",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing lastName", () => {
    const result = createBlacklistEntrySchema.safeParse({
      firstName: "Jan",
      reason: "Reden",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing reason", () => {
    const result = createBlacklistEntrySchema.safeParse({
      firstName: "Jan",
      lastName: "Peeters",
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from fields", () => {
    const result = createBlacklistEntrySchema.safeParse({
      firstName: "  Jan  ",
      lastName: "  Peeters  ",
      address: "  Kerkstraat 12  ",
      reason: "  Reden  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe("Jan");
      expect(result.data.lastName).toBe("Peeters");
      expect(result.data.address).toBe("Kerkstraat 12");
      expect(result.data.reason).toBe("Reden");
    }
  });

  it("rejects firstName exceeding 100 characters", () => {
    const result = createBlacklistEntrySchema.safeParse({
      firstName: "A".repeat(101),
      lastName: "Peeters",
      reason: "Reden",
    });
    expect(result.success).toBe(false);
  });

  it("rejects lastName exceeding 100 characters", () => {
    const result = createBlacklistEntrySchema.safeParse({
      firstName: "Jan",
      lastName: "P".repeat(101),
      reason: "Reden",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateBlacklistEntrySchema", () => {
  it("accepts valid update with all fields", () => {
    const result = updateBlacklistEntrySchema.safeParse({
      id: 1,
      firstName: "Jan",
      lastName: "Peeters",
      address: "Nieuwe straat 5",
      reason: "Geüpdatete reden",
    });
    expect(result.success).toBe(true);
  });

  it("requires positive id", () => {
    const result = updateBlacklistEntrySchema.safeParse({
      id: 0,
      firstName: "Jan",
      lastName: "Peeters",
      reason: "Reden",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative id", () => {
    const result = updateBlacklistEntrySchema.safeParse({
      id: -1,
      firstName: "Jan",
      lastName: "Peeters",
      reason: "Reden",
    });
    expect(result.success).toBe(false);
  });

  it("coerces string id to number", () => {
    const result = updateBlacklistEntrySchema.safeParse({
      id: "5",
      firstName: "Jan",
      lastName: "Peeters",
      reason: "Reden",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(5);
    }
  });
});
