import { describe, expect, it } from "vitest";
import { INTAKE_REASONS, getIntakeReasonLabel } from "./constants";

describe("INTAKE_REASONS", () => {
  it("bevat exact 3 opties in de juiste volgorde", () => {
    expect(INTAKE_REASONS).toHaveLength(3);
    expect(INTAKE_REASONS.map((r) => r.value)).toEqual([
      "afstand",
      "ibn",
      "zwerfhond",
    ]);
  });

  it("heeft de juiste Nederlandse labels", () => {
    const byValue = Object.fromEntries(
      INTAKE_REASONS.map((r) => [r.value, r.label]),
    );
    expect(byValue.afstand).toBe("Afstand door eigenaar");
    expect(byValue.ibn).toBe("Inbeslagname (IBN)");
    expect(byValue.zwerfhond).toBe("Vondeling");
  });
});

describe("getIntakeReasonLabel", () => {
  it("retourneert het label voor de 3 hoofdwaarden", () => {
    expect(getIntakeReasonLabel("afstand")).toBe("Afstand door eigenaar");
    expect(getIntakeReasonLabel("ibn")).toBe("Inbeslagname (IBN)");
    expect(getIntakeReasonLabel("zwerfhond")).toBe("Vondeling");
  });

  it("retourneert '—' voor null, undefined en lege string", () => {
    expect(getIntakeReasonLabel(null)).toBe("—");
    expect(getIntakeReasonLabel(undefined)).toBe("—");
    expect(getIntakeReasonLabel("")).toBe("—");
  });

  it("retourneert '—' voor een onbekende waarde", () => {
    expect(getIntakeReasonLabel("onbekend")).toBe("—");
  });
});
