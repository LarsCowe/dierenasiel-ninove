import { describe, it, expect } from "vitest";
import { adoptionContractSchema } from "./adoption-contracts";

const validContract = {
  animalId: 5,
  candidateId: 1,
  contractDate: "2026-03-15",
  paymentAmount: "150.00",
  paymentMethod: "payconiq",
  notes: "",
};

describe("adoptionContractSchema", () => {
  it("validates valid contract", () => {
    const result = adoptionContractSchema.safeParse(validContract);
    expect(result.success).toBe(true);
  });

  it("requires animalId", () => {
    const result = adoptionContractSchema.safeParse({ ...validContract, animalId: undefined });
    expect(result.success).toBe(false);
  });

  it("requires candidateId", () => {
    const result = adoptionContractSchema.safeParse({ ...validContract, candidateId: undefined });
    expect(result.success).toBe(false);
  });

  it("requires contractDate", () => {
    const result = adoptionContractSchema.safeParse({ ...validContract, contractDate: "" });
    expect(result.success).toBe(false);
  });

  it("requires paymentAmount", () => {
    const result = adoptionContractSchema.safeParse({ ...validContract, paymentAmount: "" });
    expect(result.success).toBe(false);
  });

  it("requires paymentMethod", () => {
    const result = adoptionContractSchema.safeParse({ ...validContract, paymentMethod: "" });
    expect(result.success).toBe(false);
  });

  it("validates paymentMethod enum", () => {
    const result = adoptionContractSchema.safeParse({ ...validContract, paymentMethod: "bitcoin" });
    expect(result.success).toBe(false);
  });

  it("accepts cash", () => {
    const result = adoptionContractSchema.safeParse({ ...validContract, paymentMethod: "cash" });
    expect(result.success).toBe(true);
  });

  it("accepts payconiq", () => {
    const result = adoptionContractSchema.safeParse({ ...validContract, paymentMethod: "payconiq" });
    expect(result.success).toBe(true);
  });

  it("accepts overschrijving", () => {
    const result = adoptionContractSchema.safeParse({ ...validContract, paymentMethod: "overschrijving" });
    expect(result.success).toBe(true);
  });

  it("coerces animalId to number", () => {
    const result = adoptionContractSchema.safeParse({ ...validContract, animalId: "5" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.animalId).toBe(5);
  });

  it("coerces candidateId to number", () => {
    const result = adoptionContractSchema.safeParse({ ...validContract, candidateId: "1" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.candidateId).toBe(1);
  });

  it("allows optional notes", () => {
    const result = adoptionContractSchema.safeParse({ ...validContract, notes: undefined });
    expect(result.success).toBe(true);
  });
});
