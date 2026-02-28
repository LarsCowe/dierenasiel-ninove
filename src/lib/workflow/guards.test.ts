import { describe, it, expect } from "vitest";
import {
  evaluateGuards,
  evaluateCatOutgoingGuards,
  type GuardWarning,
  type GuardContext,
} from "./guards";

// Helper: build a full GuardContext with overrides
function makeContext(overrides: Partial<GuardContext> = {}): GuardContext {
  const defaults: GuardContext = {
    animal: {
      id: 1,
      species: "hond",
      identificationNr: "BE-123",
      isNeutered: true,
    },
    hasVaccinations: true,
    hasAdoptionContract: true,
  };
  return {
    ...defaults,
    ...overrides,
    animal: { ...defaults.animal, ...overrides.animal },
  };
}

describe("guards", () => {
  // --- evaluateGuards: transitions without guards ---

  describe("transitions without guards", () => {
    it("returns empty array for intake → registratie (no guards)", () => {
      const ctx = makeContext();
      const warnings = evaluateGuards("intake", "registratie", ctx);
      expect(warnings).toEqual([]);
    });

    it("returns empty array for registratie → medisch (no guards)", () => {
      const ctx = makeContext();
      const warnings = evaluateGuards("registratie", "medisch", ctx);
      expect(warnings).toEqual([]);
    });

    it("returns empty array for unknown transition", () => {
      const ctx = makeContext();
      const warnings = evaluateGuards("foo", "bar", ctx);
      expect(warnings).toEqual([]);
    });
  });

  // --- medisch → verblijf: identification guard ---

  describe("medisch → verblijf (identification guard)", () => {
    it("returns warning when identificationNr is null", () => {
      const ctx = makeContext({
        animal: { id: 1, species: "hond", identificationNr: null, isNeutered: true },
      });
      const warnings = evaluateGuards("medisch", "verblijf", ctx);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe("identification_missing");
      expect(warnings[0].message).toContain("Chip/identificatienummer ontbreekt");
      expect(warnings[0].field).toBe("identificationNr");
    });

    it("returns no warnings when identificationNr is present", () => {
      const ctx = makeContext({
        animal: { id: 1, species: "hond", identificationNr: "BE-123", isNeutered: true },
      });
      const warnings = evaluateGuards("medisch", "verblijf", ctx);
      expect(warnings).toEqual([]);
    });
  });

  // --- verblijf → adoptie: cat outgoing guards ---

  describe("verblijf → adoptie (cat outgoing guards)", () => {
    it("returns 3 warnings for cat missing chip, vaccination, and neutering", () => {
      const ctx = makeContext({
        animal: { id: 1, species: "kat", identificationNr: null, isNeutered: false },
        hasVaccinations: false,
      });
      const warnings = evaluateGuards("verblijf", "adoptie", ctx);
      expect(warnings).toHaveLength(3);
      const codes = warnings.map((w) => w.code);
      expect(codes).toContain("cat_chip_missing");
      expect(codes).toContain("cat_vaccination_missing");
      expect(codes).toContain("cat_neutering_missing");
    });

    it("returns only chip warning for cat missing chip only", () => {
      const ctx = makeContext({
        animal: { id: 1, species: "kat", identificationNr: null, isNeutered: true },
        hasVaccinations: true,
      });
      const warnings = evaluateGuards("verblijf", "adoptie", ctx);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe("cat_chip_missing");
    });

    it("returns only vaccination warning for cat missing vaccination only", () => {
      const ctx = makeContext({
        animal: { id: 1, species: "kat", identificationNr: "BE-456", isNeutered: true },
        hasVaccinations: false,
      });
      const warnings = evaluateGuards("verblijf", "adoptie", ctx);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe("cat_vaccination_missing");
    });

    it("returns only neutering warning for cat missing neutering only", () => {
      const ctx = makeContext({
        animal: { id: 1, species: "kat", identificationNr: "BE-456", isNeutered: false },
        hasVaccinations: true,
      });
      const warnings = evaluateGuards("verblijf", "adoptie", ctx);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe("cat_neutering_missing");
    });

    it("returns no warnings for cat with all conditions met", () => {
      const ctx = makeContext({
        animal: { id: 1, species: "kat", identificationNr: "BE-456", isNeutered: true },
        hasVaccinations: true,
      });
      const warnings = evaluateGuards("verblijf", "adoptie", ctx);
      expect(warnings).toEqual([]);
    });

    it("returns no warnings for dog (cat guards do not apply)", () => {
      const ctx = makeContext({
        animal: { id: 1, species: "hond", identificationNr: null, isNeutered: false },
        hasVaccinations: false,
      });
      const warnings = evaluateGuards("verblijf", "adoptie", ctx);
      expect(warnings).toEqual([]);
    });
  });

  // --- adoptie → afgerond: adoption contract guard ---

  describe("adoptie → afgerond (adoption contract guard)", () => {
    it("returns warning when adoption contract is missing", () => {
      const ctx = makeContext({ hasAdoptionContract: false });
      const warnings = evaluateGuards("adoptie", "afgerond", ctx);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe("adoption_contract_missing");
      expect(warnings[0].message).toContain("Adoptiecontract ontbreekt");
      expect(warnings[0].field).toBe("adoptionContract");
    });

    it("returns no warnings when adoption contract exists", () => {
      const ctx = makeContext({ hasAdoptionContract: true });
      const warnings = evaluateGuards("adoptie", "afgerond", ctx);
      expect(warnings).toEqual([]);
    });
  });

  // --- evaluateCatOutgoingGuards (reusable for AC2 outtake) ---

  describe("evaluateCatOutgoingGuards (reusable helper)", () => {
    it("returns all 3 warnings for non-compliant cat", () => {
      const ctx = makeContext({
        animal: { id: 1, species: "kat", identificationNr: null, isNeutered: false },
        hasVaccinations: false,
      });
      const warnings = evaluateCatOutgoingGuards(ctx);
      expect(warnings).toHaveLength(3);
    });

    it("returns empty for compliant cat", () => {
      const ctx = makeContext({
        animal: { id: 1, species: "kat", identificationNr: "BE-456", isNeutered: true },
        hasVaccinations: true,
      });
      const warnings = evaluateCatOutgoingGuards(ctx);
      expect(warnings).toEqual([]);
    });

    it("returns empty for dogs (not a cat)", () => {
      const ctx = makeContext({
        animal: { id: 1, species: "hond", identificationNr: null, isNeutered: false },
        hasVaccinations: false,
      });
      const warnings = evaluateCatOutgoingGuards(ctx);
      expect(warnings).toEqual([]);
    });
  });

  // --- Guard warning structure ---

  describe("guard warning structure", () => {
    it("each warning has code, message, and field properties", () => {
      const ctx = makeContext({
        animal: { id: 1, species: "kat", identificationNr: null, isNeutered: false },
        hasVaccinations: false,
      });
      const warnings = evaluateGuards("verblijf", "adoptie", ctx);
      for (const w of warnings) {
        expect(w).toHaveProperty("code");
        expect(w).toHaveProperty("message");
        expect(w).toHaveProperty("field");
        expect(typeof w.code).toBe("string");
        expect(typeof w.message).toBe("string");
        expect(typeof w.field).toBe("string");
      }
    });
  });
});
