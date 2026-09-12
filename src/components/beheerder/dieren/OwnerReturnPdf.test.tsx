import { describe, it, expect } from "vitest";
import { createElement, isValidElement, type ReactNode } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import OwnerReturnPdf, { Vakje } from "./OwnerReturnPdf";
import { buildOwnerReturnPdfData } from "@/lib/animals/owner-return";

/**
 * Story 10.64 — regressie-guard voor het formulier "Terug naar eigenaar": rendert
 * het effectief (fonts, stijlen) en kruist het de juiste vakjes aan?
 */

const basis = {
  formNr: "TNE-2026-0003",
  drawnUpOn: "2026-09-12",
  drawnUpAt: "Denderwindeke",
  ownerLastName: "Peeters",
  ownerFirstName: "An",
  ownerStreet: "Kerkstraat 1",
  ownerPostalCode: "9400",
  ownerCity: "Ninove",
  ownerCountry: "België",
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
  animalCoatDescription: "Rosse vacht, wit vlekje op de borst. Litteken linkerachterpoot.",
  stayCosts: "3 dagen x 15 €",
  totalPaid: "45.00",
};

const volledig = buildOwnerReturnPdfData(basis);
const leeg = buildOwnerReturnPdfData({
  ...basis,
  drawnUpAt: null, ownerStreet: null, ownerPostalCode: null, ownerCity: null, ownerCountry: null,
  ownerBirthDate: null, ownerBirthPlace: null, ownerPhone: null, ownerMobile: null, ownerEmail: null,
  animalSpecies: null, animalBreed: null, animalBirthDate: null, animalIdentificationNr: null,
  animalGender: "", animalNeutered: "", animalPedigree: "", animalPassportNr: null,
  animalCoatDescription: null, stayCosts: null, totalPaid: null,
});

/** Telt de aangekruiste vakjes in de elementenboom (zelfde techniek als KennelCardPdf.test). */
function telAangekruist(data: typeof volledig): number {
  let aantal = 0;
  const loop = (node: ReactNode): void => {
    if (Array.isArray(node)) { node.forEach(loop); return; }
    if (!isValidElement(node)) return;
    if (node.type === Vakje) {
      if ((node.props as { checked: boolean }).checked) aantal += 1;
      return;
    }
    if (typeof node.type === "function") {
      loop((node.type as (p: unknown) => ReactNode)(node.props));
      return;
    }
    const props = node.props as { children?: ReactNode };
    if (props.children !== undefined) loop(props.children);
  };
  loop(OwnerReturnPdf({ data }));
  return aantal;
}

describe("OwnerReturnPdf", () => {
  it("kruist M, gesteriliseerd ja en stamboom nee aan — drie vakjes", () => {
    expect(telAangekruist(volledig)).toBe(3);
  });

  it("kruist niets aan wanneer geslacht, sterilisatie en stamboom onbekend zijn", () => {
    expect(telAangekruist(leeg)).toBe(0);
  });

  it("rendert een volledig ingevuld formulier als PDF", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(OwnerReturnPdf, { data: volledig }) as any);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("rendert ook een formulier waarvan bijna niets ingevuld is", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(OwnerReturnPdf, { data: leeg }) as any);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
