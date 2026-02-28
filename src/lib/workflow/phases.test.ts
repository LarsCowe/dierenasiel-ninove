import { describe, it, expect } from "vitest";
import {
  WORKFLOW_PHASES,
  getNextPhase,
  isValidTransition,
  type WorkflowPhase,
} from "./phases";

describe("WORKFLOW_PHASES", () => {
  it("defines exactly 6 phases in correct order", () => {
    expect(WORKFLOW_PHASES).toEqual([
      "intake",
      "registratie",
      "medisch",
      "verblijf",
      "adoptie",
      "afgerond",
    ]);
  });

  it("starts with intake and ends with afgerond", () => {
    expect(WORKFLOW_PHASES[0]).toBe("intake");
    expect(WORKFLOW_PHASES[WORKFLOW_PHASES.length - 1]).toBe("afgerond");
  });
});

describe("getNextPhase", () => {
  it("returns registratie after intake", () => {
    expect(getNextPhase("intake")).toBe("registratie");
  });

  it("returns medisch after registratie", () => {
    expect(getNextPhase("registratie")).toBe("medisch");
  });

  it("returns verblijf after medisch", () => {
    expect(getNextPhase("medisch")).toBe("verblijf");
  });

  it("returns adoptie after verblijf", () => {
    expect(getNextPhase("verblijf")).toBe("adoptie");
  });

  it("returns afgerond after adoptie", () => {
    expect(getNextPhase("adoptie")).toBe("afgerond");
  });

  it("returns null for terminal phase afgerond", () => {
    expect(getNextPhase("afgerond")).toBeNull();
  });

  it("returns null for unknown phase", () => {
    expect(getNextPhase("onbekend" as WorkflowPhase)).toBeNull();
  });
});

describe("isValidTransition", () => {
  it("allows transition from intake to registratie", () => {
    expect(isValidTransition("intake", "registratie")).toBe(true);
  });

  it("rejects skipping phases (intake to medisch)", () => {
    expect(isValidTransition("intake", "medisch")).toBe(false);
  });

  it("rejects backward transitions (medisch to intake)", () => {
    expect(isValidTransition("medisch", "intake")).toBe(false);
  });

  it("rejects same-phase transition", () => {
    expect(isValidTransition("intake", "intake")).toBe(false);
  });

  it("rejects transition from terminal phase", () => {
    expect(isValidTransition("afgerond", "intake")).toBe(false);
  });
});
