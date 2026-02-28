import { describe, it, expect } from "vitest";
import { walkerRegistrationSchema } from "./walkers";

const validData = {
  firstName: "Jan",
  lastName: "Janssens",
  email: "jan@example.com",
  phone: "0471234567",
  dateOfBirth: "2000-01-15",
  address: "Kerkstraat 1, 9400 Ninove",
  allergies: "",
  childrenWalkAlong: false,
  regulationsRead: true,
};

describe("walkerRegistrationSchema", () => {
  it("accepts valid registration data", () => {
    const result = walkerRegistrationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty firstName", () => {
    const result = walkerRegistrationSchema.safeParse({ ...validData, firstName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects firstName exceeding 100 characters", () => {
    const result = walkerRegistrationSchema.safeParse({ ...validData, firstName: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects empty lastName", () => {
    const result = walkerRegistrationSchema.safeParse({ ...validData, lastName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = walkerRegistrationSchema.safeParse({ ...validData, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty phone", () => {
    const result = walkerRegistrationSchema.safeParse({ ...validData, phone: "" });
    expect(result.success).toBe(false);
  });

  it("rejects phone exceeding 20 characters", () => {
    const result = walkerRegistrationSchema.safeParse({ ...validData, phone: "0".repeat(21) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid dateOfBirth format", () => {
    const result = walkerRegistrationSchema.safeParse({ ...validData, dateOfBirth: "15-01-2000" });
    expect(result.success).toBe(false);
  });

  it("rejects empty address", () => {
    const result = walkerRegistrationSchema.safeParse({ ...validData, address: "" });
    expect(result.success).toBe(false);
  });

  it("accepts optional allergies as empty string", () => {
    const result = walkerRegistrationSchema.safeParse({ ...validData, allergies: "" });
    expect(result.success).toBe(true);
  });

  it("accepts optional allergies with text", () => {
    const result = walkerRegistrationSchema.safeParse({ ...validData, allergies: "Pollen" });
    expect(result.success).toBe(true);
  });

  it("rejects when regulationsRead is false (AC3)", () => {
    const result = walkerRegistrationSchema.safeParse({ ...validData, regulationsRead: false });
    expect(result.success).toBe(false);
  });

  it("rejects when person is under 18 years old", () => {
    // Person born 1 year ago
    const today = new Date();
    const underAge = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
    const dob = underAge.toISOString().split("T")[0];
    const result = walkerRegistrationSchema.safeParse({ ...validData, dateOfBirth: dob });
    expect(result.success).toBe(false);
  });

  it("accepts person who is exactly 18 years old", () => {
    const today = new Date();
    const exactly18 = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const dob = exactly18.toISOString().split("T")[0];
    const result = walkerRegistrationSchema.safeParse({ ...validData, dateOfBirth: dob });
    expect(result.success).toBe(true);
  });

  it("defaults childrenWalkAlong to false when not provided", () => {
    const { childrenWalkAlong: _, ...dataWithout } = validData;
    const result = walkerRegistrationSchema.safeParse(dataWithout);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.childrenWalkAlong).toBe(false);
    }
  });
});
