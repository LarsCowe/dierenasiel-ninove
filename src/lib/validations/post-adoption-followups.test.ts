import { describe, it, expect } from "vitest";
import { updateFollowupSchema, createCustomFollowupSchema } from "./post-adoption-followups";

describe("updateFollowupSchema", () => {
  it("validates status=completed with notes", () => {
    const result = updateFollowupSchema.safeParse({ id: 1, status: "completed", notes: "Dier doet het goed" });
    expect(result.success).toBe(true);
  });

  it("validates status=no_response without notes", () => {
    const result = updateFollowupSchema.safeParse({ id: 2, status: "no_response" });
    expect(result.success).toBe(true);
  });

  it("rejects status=planned (only completed/no_response)", () => {
    const result = updateFollowupSchema.safeParse({ id: 1, status: "planned" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status value", () => {
    const result = updateFollowupSchema.safeParse({ id: 1, status: "unknown" });
    expect(result.success).toBe(false);
  });

  it("requires id", () => {
    const result = updateFollowupSchema.safeParse({ status: "completed" });
    expect(result.success).toBe(false);
  });

  it("rejects notes longer than 5000 chars", () => {
    const result = updateFollowupSchema.safeParse({ id: 1, status: "completed", notes: "a".repeat(5001) });
    expect(result.success).toBe(false);
  });
});

describe("createCustomFollowupSchema", () => {
  it("validates valid input", () => {
    const result = createCustomFollowupSchema.safeParse({ contractId: 1, date: "2026-04-15" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid date format", () => {
    const result = createCustomFollowupSchema.safeParse({ contractId: 1, date: "15-04-2026" });
    expect(result.success).toBe(false);
  });

  it("requires contractId", () => {
    const result = createCustomFollowupSchema.safeParse({ date: "2026-04-15" });
    expect(result.success).toBe(false);
  });

  it("accepts optional notes", () => {
    const result = createCustomFollowupSchema.safeParse({ contractId: 1, date: "2026-04-15", notes: "Extra check" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.notes).toBe("Extra check");
  });
});
