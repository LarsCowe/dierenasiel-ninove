import { describe, it, expect } from "vitest";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import AdoptionContractPdf, { Voorwaarde, type ContractData } from "./AdoptionContractPdf";
import { unsupportedPdfChars } from "@/lib/pdf/charset";

/**
 * Story 10.65 — Sven: "opsomtekens verschijnen niet goed". Het opsomteken "✦"
 * zat niet in de tekenset van Helvetica en kwam op de PDF als "&".
 */

const basis: ContractData = {
  contractDate: "12/09/2026",
  contractNr: "2026-001",
  firstName: "An",
  lastName: "Peeters",
  address: "Kerkstraat 1, 9400 Ninove",
  phone: "0470 00 00 00",
  email: "an@example.com",
  animalName: "Bo",
  species: "hond",
  breed: "Chow Chow",
  gender: "reu",
  isNeutered: true,
  paymentAmount: "250.00",
  paymentMethod: "cash",
};

/** Loopt de elementenboom af (zelfde techniek als OwnerReturnPdf.test). */
function doorloop(node: ReactNode, bezoek: (el: ReactElement) => boolean | void): void {
  if (Array.isArray(node)) { node.forEach((n) => doorloop(n, bezoek)); return; }
  if (!isValidElement(node)) return;
  if (bezoek(node) === false) return;
  if (typeof node.type === "function") {
    doorloop((node.type as (p: unknown) => ReactNode)(node.props), bezoek);
    return;
  }
  const props = node.props as { children?: ReactNode };
  if (props.children !== undefined) doorloop(props.children, bezoek);
}

function alleTekst(data: ContractData): string {
  const stukken: string[] = [];
  const verzamel = (node: ReactNode): void => {
    if (typeof node === "string" || typeof node === "number") { stukken.push(String(node)); return; }
    if (Array.isArray(node)) { node.forEach(verzamel); return; }
    if (!isValidElement(node)) return;
    if (typeof node.type === "function") { verzamel((node.type as (p: unknown) => ReactNode)(node.props)); return; }
    verzamel((node.props as { children?: ReactNode }).children);
  };
  verzamel(AdoptionContractPdf({ data }));
  return stukken.join("\n");
}

function voorwaarden(data: ContractData): string[] {
  const teksten: string[] = [];
  doorloop(AdoptionContractPdf({ data }), (el) => {
    if (el.type === Voorwaarde) {
      teksten.push((el.props as { children: string }).children);
      return false;
    }
  });
  return teksten;
}

describe("AdoptionContractPdf — opsomtekens (story 10.65)", () => {
  it.each(["hond", "kat", "konijn"])("gebruikt enkel tekens die Helvetica kent (%s)", (species) => {
    expect(unsupportedPdfChars(alleTekst({ ...basis, species }))).toEqual([]);
  });

  it("zet de 11 voorwaarden van het hondencontract elk als opsomming", () => {
    const lijst = voorwaarden(basis);
    expect(lijst).toHaveLength(11);
    expect(lijst[0]).toMatch(/^Het dier zal binnenshuis verblijven/);
  });

  it("zet de 11 voorwaarden van het kattencontract elk als opsomming", () => {
    const lijst = voorwaarden({ ...basis, species: "kat" });
    expect(lijst).toHaveLength(11);
    expect(lijst[0]).toMatch(/^Het welzijn van het dier/);
  });

  it("toont geen voorwaarden op het contract voor andere dieren", () => {
    expect(voorwaarden({ ...basis, species: "konijn" })).toEqual([]);
  });

  it("zet het opsomteken • in een eigen kolom, los van de tekst (hangende inspringing)", () => {
    const rij = Voorwaarde({ children: "Het welzijn van het dier." }) as ReactElement<{
      style: { flexDirection?: string };
      children: ReactElement<{ children: string; style: { flex?: number } }>[];
    }>;
    expect(rij.props.style.flexDirection).toBe("row");
    const [teken, tekst] = rij.props.children;
    expect(teken.props.children).toBe("•");
    expect(tekst.props.children).toBe("Het welzijn van het dier.");
    expect(tekst.props.style.flex).toBe(1);
  });

  // Ruimere timeout, zoals de andere PDF-tests: alleen ~1 s, maar onder de
  // parallelle belasting van de volledige suite liep het tegen de 5 s aan.
  it.each(["hond", "kat", "konijn"])("rendert het contract als PDF (%s)", async (species) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(createElement(AdoptionContractPdf, { data: { ...basis, species } }) as any);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  }, 30000);
});
