import { describe, it, expect } from "vitest";
import { buildBookletLabel, type BookletLabelInput } from "./booklet-label";

/**
 * Story 10.66 — het etiket dat bij adoptie achteraan in het boekje komt:
 * welke ontwormingen het dier kreeg en of het bij ons gesteriliseerd werd.
 */

const dier: BookletLabelInput["animal"] = {
  name: "Bo",
  identificationNr: "981000012345678",
  isNeutered: true,
  neuteredByShelter: true,
  neuteredDate: "2026-05-12",
};

function etiket(overrides: Partial<BookletLabelInput> = {}) {
  return buildBookletLabel({ animal: dier, dewormings: [], ...overrides });
}

describe("buildBookletLabel — naam en chip", () => {
  it("neemt naam en chipnummer over, zonder spaties rond", () => {
    const model = etiket({ animal: { ...dier, name: "  Bo ", identificationNr: " 981000012345678 " } });
    expect(model.naam).toBe("Bo");
    expect(model.chip).toBe("981000012345678");
  });

  it("laat de chip leeg als het dier er geen heeft", () => {
    expect(etiket({ animal: { ...dier, identificationNr: null } }).chip).toBe("");
  });
});

describe("buildBookletLabel — ontwormingen", () => {
  it("zet ze van oud naar nieuw, met datum als dd/mm/jjjj en het product", () => {
    const model = etiket({
      dewormings: [
        { date: "2026-06-22", type: "Milbemax", category: "ontworming" },
        { date: "2026-04-21", type: " Canicantel ", category: "ontworming" },
      ],
    });
    expect(model.ontwormingen).toEqual([
      { datum: "21/04/2026", product: "Canicantel" },
      { datum: "22/06/2026", product: "Milbemax" },
    ]);
  });

  it("laat vlooienbehandelingen weg — die delen de tabel maar horen niet op het etiket", () => {
    const model = etiket({
      dewormings: [
        { date: "2026-04-21", type: "Canicantel", category: "ontworming" },
        { date: "2026-04-22", type: "Frontline", category: "vlooien" },
      ],
    });
    expect(model.ontwormingen.map((o) => o.product)).toEqual(["Canicantel"]);
  });

  it("geeft een lege lijst als er geen ontwormingen zijn", () => {
    expect(etiket().ontwormingen).toEqual([]);
  });
});

describe("buildBookletLabel — sterilisatie", () => {
  it("door het asiel, met datum", () => {
    expect(etiket().steriel).toBe("Ja, door het asiel op 12/05/2026");
  });

  it("door het asiel, zonder gekende datum", () => {
    expect(etiket({ animal: { ...dier, neuteredDate: null } }).steriel).toBe("Ja, door het asiel");
  });

  it("elders gesteriliseerd", () => {
    expect(etiket({ animal: { ...dier, neuteredByShelter: false } }).steriel).toBe("Ja (niet door het asiel)");
  });

  it("gesteriliseerd, maar onbekend door wie", () => {
    expect(etiket({ animal: { ...dier, neuteredByShelter: null, neuteredDate: null } }).steriel).toBe("Ja");
  });

  it("niet gesteriliseerd — ook als er nog een oude vlag 'door asiel' zou staan", () => {
    expect(etiket({ animal: { ...dier, isNeutered: false } }).steriel).toBe("Neen");
  });

  it("onbekend blijft leeg, om met de hand in te vullen", () => {
    expect(etiket({ animal: { ...dier, isNeutered: null } }).steriel).toBe("");
  });
});
