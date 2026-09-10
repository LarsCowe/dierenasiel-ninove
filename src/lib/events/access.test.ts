import { describe, it, expect } from "vitest";
import { eventRights, isTrekker } from "./access";

describe("isTrekker", () => {
  it("herkent de trekker van het evenement", () => {
    expect(isTrekker(4, 4)).toBe(true);
  });

  it("is niemand wanneer het evenement geen trekker heeft", () => {
    expect(isTrekker(4, null)).toBe(false);
  });

  it("is niemand zonder aangemelde gebruiker", () => {
    expect(isTrekker(null, 4)).toBe(false);
    expect(isTrekker(null, null)).toBe(false);
  });

  it("is iemand anders niet", () => {
    expect(isTrekker(5, 4)).toBe(false);
  });
});

describe("eventRights", () => {
  it("geeft de beheerder alles, ook zonder trekker te zijn", () => {
    expect(eventRights("beheerder", 1, null)).toEqual({
      zien: true,
      draaiboek: true,
      geld: true,
      beheer: true,
    });
  });

  it("laat een medewerker-trekker het draaiboek doen, maar niet aan het geld", () => {
    expect(eventRights("medewerker", 4, 4)).toEqual({
      zien: true,
      draaiboek: true,
      geld: false,
      beheer: false,
    });
  });

  it("geeft een medewerker die geen trekker is niets", () => {
    expect(eventRights("medewerker", 5, 4)).toEqual({
      zien: false,
      draaiboek: false,
      geld: false,
      beheer: false,
    });
  });

  it("volgt de trekker, niet de rol: ook een coördinator-trekker mag het draaiboek", () => {
    expect(eventRights("coördinator", 4, 4).draaiboek).toBe(true);
    expect(eventRights("coördinator", 5, 4).zien).toBe(false);
  });

  it("geeft een onbekende rol zonder trekkerschap niets", () => {
    expect(eventRights("wandelaar", 9, null).zien).toBe(false);
  });

  it("geeft een trekker die intussen geen backoffice-rol meer heeft niets (review 13.14)", () => {
    // trekker_user_id blijft staan als iemands rol wijzigt; de rechten mogen dat niet.
    expect(eventRights("wandelaar", 4, 4)).toEqual({
      zien: false,
      draaiboek: false,
      geld: false,
      beheer: false,
    });
    expect(eventRights("surfer", 4, 4).draaiboek).toBe(false);
  });
});
