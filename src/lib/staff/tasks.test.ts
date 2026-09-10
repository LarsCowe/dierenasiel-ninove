import { describe, it, expect } from "vitest";
import { STAFF_TASK_SUGGESTIONS, TASK_MAX_LENGTH, normalizeTask, taskSuggestions } from "./tasks";

describe("STAFF_TASK_SUGGESTIONS", () => {
  // Sven, 2026-08-10: "vb zwerfkat ophalen, dier naar dierenarts brengen, haag snoeien" —
  // en zijn plaatsjes-voorbeeld: "kuis honden, kuis katten, opruim zolder".
  it("bevat de voorbeelden van Sven", () => {
    expect(STAFF_TASK_SUGGESTIONS).toEqual(
      expect.arrayContaining([
        "Zwerfkat ophalen",
        "Dier naar de dierenarts brengen",
        "Haag snoeien",
        "Kuis honden",
        "Kuis katten",
        "Opruim zolder",
      ]),
    );
  });

  it("heeft geen dubbels", () => {
    const klein = STAFF_TASK_SUGGESTIONS.map((t) => t.toLowerCase());
    expect(new Set(klein).size).toBe(klein.length);
  });
});

describe("normalizeTask", () => {
  it("haalt overbodige spaties weg", () => {
    expect(normalizeTask("  haag   snoeien ")).toBe("haag snoeien");
  });

  it("maakt van een lege taak null", () => {
    expect(normalizeTask("")).toBeNull();
    expect(normalizeTask("   ")).toBeNull();
    expect(normalizeTask(null)).toBeNull();
    expect(normalizeTask(undefined)).toBeNull();
  });
});

describe("TASK_MAX_LENGTH", () => {
  it("past in de kolom van 120 tekens", () => {
    expect(TASK_MAX_LENGTH).toBe(120);
  });
});

describe("taskSuggestions", () => {
  it("geeft de vaste voorstellen wanneer er nog niets ingevuld werd", () => {
    expect(taskSuggestions([])).toEqual([...STAFF_TASK_SUGGESTIONS]);
  });

  it("vult aan met wat eerder al ingevuld werd, achteraan en alfabetisch", () => {
    const lijst = taskSuggestions(["Ramen wassen", "Afval buiten zetten"]);
    expect(lijst.slice(0, STAFF_TASK_SUGGESTIONS.length)).toEqual([...STAFF_TASK_SUGGESTIONS]);
    expect(lijst.slice(STAFF_TASK_SUGGESTIONS.length)).toEqual(["Afval buiten zetten", "Ramen wassen"]);
  });

  it("herhaalt een vast voorstel niet, ongeacht hoofdletters en spaties", () => {
    const lijst = taskSuggestions(["kuis honden", " Haag  snoeien "]);
    expect(lijst).toEqual([...STAFF_TASK_SUGGESTIONS]);
  });

  it("neemt een eerder ingevulde taak maar één keer op", () => {
    const lijst = taskSuggestions(["Ramen wassen", "ramen wassen", "Ramen  wassen"]);
    expect(lijst.filter((t) => t.toLowerCase() === "ramen wassen")).toHaveLength(1);
  });

  it("negeert lege en ontbrekende taken", () => {
    expect(taskSuggestions([null, "", "   "])).toEqual([...STAFF_TASK_SUGGESTIONS]);
  });
});
