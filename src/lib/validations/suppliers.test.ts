import { describe, it, expect } from "vitest";
import { supplierSchema } from "./suppliers";

// Story 13.16 — één leverancier uit de lijst.

describe("supplierSchema", () => {
  it("maakt van lege velden null en vult de website aan", () => {
    const res = supplierSchema.safeParse({
      name: " Brouwerij De Ryck ",
      phone: "",
      email: "",
      website: "deryck.be",
      notes: "",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toEqual({
        name: "Brouwerij De Ryck",
        phone: null,
        email: null,
        website: "https://deryck.be",
        notes: null,
      });
    }
  });

  it("vraagt een naam", () => {
    const res = supplierSchema.safeParse({ name: "  " });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.flatten().fieldErrors.name?.[0]).toMatch(/naam/i);
  });

  it("weigert een ongeldig e-mailadres", () => {
    const res = supplierSchema.safeParse({ name: "De Ryck", email: "info@deryck" });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.flatten().fieldErrors.email).toBeDefined();
  });

  it("laat een gsm-nummer van hoogstens 30 tekens toe", () => {
    expect(supplierSchema.safeParse({ name: "X", phone: "0470 12 34 56" }).success).toBe(true);
    expect(supplierSchema.safeParse({ name: "X", phone: "1".repeat(31) }).success).toBe(false);
  });
});
