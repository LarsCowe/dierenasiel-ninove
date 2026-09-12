import { describe, it, expect, vi } from "vitest";
import { buildOwnerReturnAttachment, ownerReturnPdfFilename } from "./owner-return-document";

/** Story 10.64 — welk bestand gaat als bijlage mee naar de eigenaar? */

const form = {
  formNr: "TNE-2026-0003",
  drawnUpOn: "2026-09-12",
  drawnUpAt: "Denderwindeke",
  ownerLastName: "Peeters",
  ownerFirstName: "An",
  ownerStreet: null, ownerPostalCode: null, ownerCity: null, ownerCountry: null,
  ownerBirthDate: null, ownerBirthPlace: null, ownerPhone: null, ownerMobile: null, ownerEmail: "an@example.com",
  animalName: "Bo",
  animalSpecies: "hond", animalBreed: null, animalBirthDate: null, animalIdentificationNr: null,
  animalGender: "M", animalNeutered: "", animalPedigree: "", animalPassportNr: null, animalCoatDescription: null,
  stayCosts: null, totalPaid: null,
  signedDocumentUrl: null as string | null,
};

// `fetch` wordt meegegeven, niet globaal vervangen: @react-pdf laadt zijn wasm-layoutmotor
// zelf via fetch, en een globale stub maakte de rendertest flaky onder belasting.
const fetchMock = vi.fn();
const ophalen = fetchMock as unknown as typeof fetch;
function metScan() {
  fetchMock.mockReset();
}

describe("ownerReturnPdfFilename", () => {
  it("draagt het volgnummer", () => {
    expect(ownerReturnPdfFilename("TNE-2026-0003")).toBe("terug-naar-eigenaar-TNE-2026-0003.pdf");
  });
});

describe("buildOwnerReturnAttachment", () => {
  it("rendert de PDF wanneer er geen getekende versie is", async () => {
    const bijlage = await buildOwnerReturnAttachment(form);
    expect(bijlage.signed).toBe(false);
    expect(bijlage.filename).toBe("terug-naar-eigenaar-TNE-2026-0003.pdf");
    expect(bijlage.content.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("haalt de getekende scan op en houdt de extensie van de scan (een foto blijft een foto)", async () => {
    metScan();
    fetchMock.mockResolvedValue({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer });
    const bijlage = await buildOwnerReturnAttachment(
      { ...form, signedDocumentUrl: "https://blob.vercel-storage.com/owner-return-forms/TNE-2026-0003-1-getekend.JPG?x=1" },
      ophalen,
    );
    expect(bijlage.signed).toBe(true);
    expect(bijlage.filename).toBe("terug-naar-eigenaar-TNE-2026-0003-getekend.jpg");
    expect(Array.from(bijlage.content)).toEqual([1, 2, 3]);
  });

  it("valt terug op .pdf als de scan-URL geen extensie draagt", async () => {
    metScan();
    fetchMock.mockResolvedValue({ ok: true, arrayBuffer: async () => new Uint8Array([9]).buffer });
    const bijlage = await buildOwnerReturnAttachment({ ...form, signedDocumentUrl: "https://blob/scan" }, ophalen);
    expect(bijlage.filename).toBe("terug-naar-eigenaar-TNE-2026-0003-getekend.pdf");
  });

  it("gooit een fout als de scan niet op te halen is, zodat de mail NIET zonder bijlage vertrekt", async () => {
    metScan();
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    await expect(buildOwnerReturnAttachment({ ...form, signedDocumentUrl: "https://blob/weg.pdf" }, ophalen)).rejects.toThrow("404");
  });
});
