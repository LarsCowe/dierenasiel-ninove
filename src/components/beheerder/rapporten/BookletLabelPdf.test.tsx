import { describe, it, expect } from "vitest";
import { createElement, isValidElement, type ReactNode } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import BookletLabelPdf from "./BookletLabelPdf";
import type { BookletLabelModel } from "@/lib/animals/booklet-label";

/**
 * Story 10.66 — etiket voor het boekje, op een DYMO 99014 (54 × 101 mm).
 */

const etiket: BookletLabelModel = {
  naam: "Bo",
  chip: "981000012345678",
  steriel: "Ja, door het asiel op 12/05/2026",
  ontwormingen: [
    { datum: "21/04/2026", product: "Canicantel" },
    { datum: "22/06/2026", product: "Milbemax" },
  ],
};

const veel: BookletLabelModel = {
  ...etiket,
  ontwormingen: Array.from({ length: 30 }, (_, i) => ({
    datum: `${String((i % 28) + 1).padStart(2, "0")}/05/2026`,
    product: "Milbemax kitten",
  })),
};

async function render(model: BookletLabelModel): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(BookletLabelPdf, { etiket: model }) as any);
  return buffer.toString("latin1");
}

function aantalEtiketten(pdf: string): number {
  return (pdf.match(/\/Type \/Page\b/g) ?? []).length;
}

function alleTekst(model: BookletLabelModel): string {
  const stukken: string[] = [];
  const verzamel = (node: ReactNode): void => {
    if (typeof node === "string" || typeof node === "number") { stukken.push(String(node)); return; }
    if (Array.isArray(node)) { node.forEach(verzamel); return; }
    if (!isValidElement(node)) return;
    if (typeof node.type === "function") { verzamel((node.type as (p: unknown) => ReactNode)(node.props)); return; }
    verzamel((node.props as { children?: ReactNode }).children);
  };
  verzamel(BookletLabelPdf({ etiket: model }));
  return stukken.join("\n");
}

describe("BookletLabelPdf", () => {
  // Ruimere timeout zoals de andere PDF-tests (parallelle belasting in de volle suite).
  it("is precies 101 × 54 mm, liggend", async () => {
    const pdf = await render(etiket);
    const box = /\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(pdf);
    expect(box).not.toBeNull();
    const mm = (pt: string) => (parseFloat(pt) * 25.4) / 72;
    expect(mm(box![1])).toBeCloseTo(101, 0);
    expect(mm(box![2])).toBeCloseTo(54, 0);
  }, 30000);

  it("past met een paar ontwormingen op één etiket", async () => {
    expect(aantalEtiketten(await render(etiket))).toBe(1);
  }, 30000);

  it("loopt bij veel ontwormingen door op een volgend etiket", async () => {
    expect(aantalEtiketten(await render(veel))).toBeGreaterThan(1);
  }, 30000);

  it("toont naam, chip, sterilisatie en elke ontworming", () => {
    const tekst = alleTekst(etiket);
    for (const stuk of ["Bo", "981000012345678", "Ja, door het asiel op 12/05/2026", "21/04/2026", "Canicantel", "22/06/2026", "Milbemax"]) {
      expect(tekst).toContain(stuk);
    }
  });

  it("zegt het uitdrukkelijk als er geen ontwormingen zijn", () => {
    expect(alleTekst({ ...etiket, ontwormingen: [] })).toContain("Geen ontwormingen geregistreerd");
  });

  it("herhaalt naam en chip bovenaan elk etiket (vaste kop)", () => {
    const kop: { fixed?: boolean; tekst: string }[] = [];
    const zoek = (node: ReactNode): void => {
      if (Array.isArray(node)) { node.forEach(zoek); return; }
      if (!isValidElement(node)) return;
      if (typeof node.type === "function") { zoek((node.type as (p: unknown) => ReactNode)(node.props)); return; }
      const props = node.props as { fixed?: boolean; children?: ReactNode };
      if (props.fixed) {
        const stukken: string[] = [];
        const tekst = (n: ReactNode): void => {
          if (typeof n === "string") stukken.push(n);
          else if (Array.isArray(n)) n.forEach(tekst);
          else if (isValidElement(n)) tekst((n.props as { children?: ReactNode }).children);
        };
        tekst(props.children);
        kop.push({ fixed: true, tekst: stukken.join(" ") });
        return;
      }
      zoek(props.children);
    };
    zoek(BookletLabelPdf({ etiket }));
    expect(kop.some((k) => k.tekst.includes("Bo") && k.tekst.includes("981000012345678"))).toBe(true);
  });
});
