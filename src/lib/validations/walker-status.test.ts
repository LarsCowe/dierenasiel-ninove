import { describe, it, expect } from "vitest";
import { walkerStatusUpdateSchema } from "./walker-status";

describe("walkerStatusUpdateSchema", () => {
  it("accepts approved status without reason", () => {
    const result = walkerStatusUpdateSchema.safeParse({ status: "approved" });
    expect(result.success).toBe(true);
  });

  it("accepts rejected status with reason", () => {
    const result = walkerStatusUpdateSchema.safeParse({
      status: "rejected",
      rejectionReason: "Reglement niet gelezen",
    });
    expect(result.success).toBe(true);
  });

  it("rejects rejected status without reason", () => {
    const result = walkerStatusUpdateSchema.safeParse({
      status: "rejected",
      rejectionReason: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts inactive status without reason", () => {
    const result = walkerStatusUpdateSchema.safeParse({ status: "inactive" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status value", () => {
    const result = walkerStatusUpdateSchema.safeParse({ status: "pending" });
    expect(result.success).toBe(false);
  });

  it("rejects empty status", () => {
    const result = walkerStatusUpdateSchema.safeParse({ status: "" });
    expect(result.success).toBe(false);
  });
});
