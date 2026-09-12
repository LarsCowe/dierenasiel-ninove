import { describe, it, expect } from "vitest";
import {
  nextOwnerReturnNr,
  genderToMV,
  prefillFromAnimal,
  buildOwnerReturnPdfData,
  ownerFullName,
  OWNER_RETURN_NR_PREFIX,
} from "./owner-return";

/** Story 10.64 — pure logica rond het formulier "Terug naar eigenaar". */

describe("nextOwnerReturnNr", () => {
  it("begint elk jaar opnieuw op 0001", () => {
    expect(nextOwnerReturnNr(2026, null)).toBe("TNE-2026-0001");
    expect(nextOwnerReturnNr(2026, "TNE-2025-0042")).toBe("TNE-2026-0001");
  });

  it("telt door binnen hetzelfde jaar", () => {
    expect(nextOwnerReturnNr(2026, "TNE-2026-0042")).toBe("TNE-2026-0043");
    expect(nextOwnerReturnNr(2026, "TNE-2026-9999")).toBe("TNE-2026-10000");
  });

  it("negeert een nummer dat niet het verwachte formaat heeft", () => {
    expect(nextOwnerReturnNr(2026, "onzin")).toBe("TNE-2026-0001");
  });

  it("gebruikt het vaste voorvoegsel", () => {
    expect(OWNER_RETURN_NR_PREFIX).toBe("TNE");
  });
});

describe("genderToMV", () => {
  it("vertaalt het canonieke geslacht naar M of V zoals op Sven's formulier", () => {
    expect(genderToMV("reu")).toBe("M");
    expect(genderToMV("kater")).toBe("M");
    expect(genderToMV("mannetje")).toBe("M");
    expect(genderToMV("teef")).toBe("V");
    expect(genderToMV("poes")).toBe("V");
    expect(genderToMV("vrouwtje")).toBe("V");
  });

  it("kent ook de oude waarden van vóór story 10.37", () => {
    expect(genderToMV("mannelijk")).toBe("M");
    expect(genderToMV("vrouwelijk")).toBe("V");
  });

  it("laat onbekend of leeg blanco", () => {
    expect(genderToMV(null)).toBeNull();
    expect(genderToMV("")).toBeNull();
    expect(genderToMV("onbekend")).toBeNull();
  });
});

describe("prefillFromAnimal", () => {
  it("neemt de fiche over als momentopname, met M/V en ja/nee-velden", () => {
    const snapshot = prefillFromAnimal({
      name: "Bo",
      species: "hond",
      breed: "Chow Chow",
      dateOfBirth: "2024-10-27",
      identificationNr: "981000012345678",
      gender: "reu",
      isNeutered: true,
      passportNr: "BE-123",
      description: "Rosse vacht, wit vlekje op de borst",
    });

    expect(snapshot).toEqual({
      animalName: "Bo",
      animalSpecies: "hond",
      animalBreed: "Chow Chow",
      animalBirthDate: "2024-10-27",
      animalIdentificationNr: "981000012345678",
      animalGender: "M",
      animalNeutered: "ja",
      animalPedigree: "",
      animalPassportNr: "BE-123",
      animalCoatDescription: "Rosse vacht, wit vlekje op de borst",
    });
  });

  it("laat lege velden leeg in plaats van 'null' te schrijven", () => {
    const snapshot = prefillFromAnimal({
      name: "Naamloos",
      species: "kat",
      breed: null,
      dateOfBirth: null,
      identificationNr: null,
      gender: "onbekend",
      isNeutered: null,
      passportNr: null,
      description: "",
    });

    expect(snapshot.animalBreed).toBe("");
    expect(snapshot.animalBirthDate).toBe("");
    expect(snapshot.animalGender).toBe("");
    expect(snapshot.animalNeutered).toBe("");
    expect(snapshot.animalCoatDescription).toBe("");
  });
});

describe("ownerFullName", () => {
  it("zet familienaam voor voornaam, zonder dubbele spaties", () => {
    expect(ownerFullName({ ownerLastName: "Peeters", ownerFirstName: "An" })).toBe("Peeters An");
    expect(ownerFullName({ ownerLastName: "Peeters", ownerFirstName: "" })).toBe("Peeters");
  });
});

describe("buildOwnerReturnPdfData", () => {
  const record = {
    formNr: "TNE-2026-0003",
    drawnUpOn: "2026-09-12",
    drawnUpAt: "Denderwindeke",
    ownerLastName: "Peeters",
    ownerFirstName: "An",
    ownerStreet: "Kerkstraat 1",
    ownerPostalCode: "9400",
    ownerCity: "Ninove",
    ownerCountry: "",
    ownerBirthDate: "1980-02-03",
    ownerBirthPlace: "Aalst",
    ownerPhone: "054 00 00 00",
    ownerMobile: "0470 00 00 00",
    ownerEmail: "an@example.com",
    animalName: "Bo",
    animalSpecies: "hond",
    animalBreed: "Chow Chow",
    animalBirthDate: "2024-10-27",
    animalIdentificationNr: "981000012345678",
    animalGender: "M",
    animalNeutered: "ja",
    animalPedigree: "nee",
    animalPassportNr: "BE-123",
    animalCoatDescription: "Rosse vacht",
    stayCosts: "3 dagen x 15 €",
    totalPaid: "45",
  };

  it("zet datums in de Belgische notatie en vinkjes als booleans", () => {
    const data = buildOwnerReturnPdfData(record);
    expect(data.drawnUpOn).toBe("12/09/2026");
    expect(data.ownerBirthDate).toBe("03/02/1980");
    expect(data.animalBirthDate).toBe("27/10/2024");
    expect(data.genderM).toBe(true);
    expect(data.genderV).toBe(false);
    expect(data.neuteredYes).toBe(true);
    expect(data.neuteredNo).toBe(false);
    expect(data.pedigreeYes).toBe(false);
    expect(data.pedigreeNo).toBe(true);
    expect(data.speciesLabel).toBe("Hond");
    expect(data.totalPaid).toBe("45");
  });

  it("laat een onbekend antwoord onaangevinkt", () => {
    const data = buildOwnerReturnPdfData({ ...record, animalGender: "", animalNeutered: "", animalPedigree: "" });
    expect(data.genderM).toBe(false);
    expect(data.genderV).toBe(false);
    expect(data.neuteredYes).toBe(false);
    expect(data.neuteredNo).toBe(false);
    expect(data.pedigreeYes).toBe(false);
    expect(data.pedigreeNo).toBe(false);
  });

  it("laat een lege of onleesbare datum leeg", () => {
    const data = buildOwnerReturnPdfData({ ...record, ownerBirthDate: "", animalBirthDate: "geen idee" });
    expect(data.ownerBirthDate).toBe("");
    expect(data.animalBirthDate).toBe("geen idee");
  });
});
