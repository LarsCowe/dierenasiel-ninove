import { describe, it, expect } from "vitest";
import { personLabel, sortVolunteers } from "./volunteers";

describe("personLabel", () => {
  it("noemt iemand met een wandelaarsaccount een wandelaar", () => {
    expect(personLabel({ userId: 30, userRole: "wandelaar" })).toBe("wandelaar");
  });

  it("noemt iemand zonder account een vrijwilliger", () => {
    expect(personLabel({ userId: null, userRole: null })).toBe("vrijwilliger");
  });

  it("zet niets bij een medewerker of een andere backoffice-rol", () => {
    expect(personLabel({ userId: 7, userRole: "medewerker" })).toBeNull();
    expect(personLabel({ userId: 20, userRole: "beheerder" })).toBeNull();
  });
});

describe("sortVolunteers", () => {
  it("sorteert de wandelaars op naam, zonder op hoofdletters te letten", () => {
    const lijst = sortVolunteers([
      { userId: 3, name: "Zoë" },
      { userId: 1, name: "anja" },
      { userId: 2, name: "Bert" },
    ]);
    expect(lijst.map((v) => v.name)).toEqual(["anja", "Bert", "Zoë"]);
  });

  // Code-review 14.4: twee wandelaarsrecords kunnen naar hetzelfde account wijzen (opnieuw
  // geregistreerd met hetzelfde e-mailadres) — dan mag die persoon maar één keer in de lijst.
  it("zet iemand met twee wandelaarsrecords maar één keer in de lijst", () => {
    const lijst = sortVolunteers([
      { userId: 30, name: "Els" },
      { userId: 31, name: "Bert" },
      { userId: 30, name: "Els" },
    ]);
    expect(lijst.map((v) => v.userId)).toEqual([31, 30]);
  });

  it("laat de oorspronkelijke lijst ongemoeid", () => {
    const origineel = [{ userId: 2, name: "Bert" }, { userId: 1, name: "Anja" }];
    sortVolunteers(origineel);
    expect(origineel[0].name).toBe("Bert");
  });
});
