import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { unsupportedPdfChars } from "./charset";

describe("unsupportedPdfChars", () => {
  it("laat gewone tekst, accenten en het euroteken door", () => {
    expect(unsupportedPdfChars("Financiële vergoeding van €250 — zo’n «rapport» ¼ ç ÿ")).toEqual([]);
  });

  it("laat het opsomteken • door (zit in WinAnsi)", () => {
    expect(unsupportedPdfChars("• Het welzijn van het dier")).toEqual([]);
  });

  it("meldt tekens die Helvetica niet kent, elk één keer", () => {
    expect(unsupportedPdfChars("✦ een ✦ twee ✓ → ☐")).toEqual(["✦", "✓", "→", "☐"]);
  });

  it("meldt ook emoji", () => {
    expect(unsupportedPdfChars("Hond 🐶")).toEqual(["🐶"]);
  });
});

/**
 * Story 10.65 — de PDF's gebruiken de ingebouwde Helvetica, die enkel WinAnsi
 * kent. Een teken daarbuiten komt er als iets anders uit: "✦" (U+2726) werd "&"
 * op het adoptiecontract. Deze test vangt zo'n teken vóór Sven het ziet.
 * Commentaar telt niet mee.
 */
describe("PDF-componenten gebruiken enkel tekens die Helvetica kent", () => {
  const vindPdfComponenten = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const pad = join(dir, name);
      if (statSync(pad).isDirectory()) return vindPdfComponenten(pad);
      return name.endsWith("Pdf.tsx") ? [pad] : [];
    });

  const bestanden = vindPdfComponenten("src/components");

  /** Haalt commentaar weg en zet \uXXXX- en \u{…}-escapes om naar het teken zelf. */
  const tekstVan = (bron: string): string =>
    bron
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/.*$/gm, "$1")
      .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)));

  it("vindt de PDF-componenten", () => {
    expect(bestanden.length).toBeGreaterThan(15);
  });

  it.each(bestanden)("%s", (bestand) => {
    expect(unsupportedPdfChars(tekstVan(readFileSync(bestand, "utf8")))).toEqual([]);
  });
});
