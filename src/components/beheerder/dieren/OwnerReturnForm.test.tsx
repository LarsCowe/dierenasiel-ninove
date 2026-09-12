// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import OwnerReturnForm from "./OwnerReturnForm";

/** Story 10.64 — het invulscherm voor "Terug naar eigenaar". */

const { mockUseActionState, mockPush } = vi.hoisted(() => ({
  mockUseActionState: vi.fn(),
  mockPush: vi.fn(),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, useActionState: mockUseActionState };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush, refresh: vi.fn() }) }));
vi.mock("@/lib/actions/owner-return", () => ({ createOwnerReturnForm: vi.fn() }));

const prefill = {
  animalName: "Bo",
  animalSpecies: "hond",
  animalBreed: "Chow Chow",
  animalBirthDate: "2024-10-27",
  animalIdentificationNr: "981000012345678",
  animalGender: "M",
  animalNeutered: "ja",
  animalPedigree: "",
  animalPassportNr: "BE-123",
  animalCoatDescription: "Rosse vacht",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseActionState.mockReturnValue([null, vi.fn(), false]);
});

describe("OwnerReturnForm", () => {
  it("vult de diergegevens uit de fiche in, maar laat ze bewerkbaar", () => {
    render(<OwnerReturnForm animalId={7} prefill={prefill} today="2026-09-12" />);

    const naam = screen.getByLabelText(/^Naam/) as HTMLInputElement;
    expect(naam.value).toBe("Bo");
    expect(naam).not.toHaveAttribute("readonly");
    expect((screen.getByLabelText(/^Ras/) as HTMLInputElement).value).toBe("Chow Chow");
    expect((screen.getByLabelText(/Identificatienr/) as HTMLInputElement).value).toBe("981000012345678");
    expect(screen.getByRole("radio", { name: "M" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "V" })).not.toBeChecked();
  });

  it("toont de diersoort met haar Nederlandse naam, als keuzelijst", () => {
    render(<OwnerReturnForm animalId={7} prefill={prefill} today="2026-09-12" />);
    const soort = screen.getByLabelText(/Diersoort/) as HTMLSelectElement;
    expect(soort.tagName).toBe("SELECT");
    expect(soort.value).toBe("hond");
    expect(soort.selectedOptions[0].textContent).toBe("Hond");
  });

  it("houdt een soort die niet in de lijst staat als keuze, zodat niets stil verandert", () => {
    render(<OwnerReturnForm animalId={7} prefill={{ ...prefill, animalSpecies: "fret" }} today="2026-09-12" />);
    const soort = screen.getByLabelText(/Diersoort/) as HTMLSelectElement;
    expect(soort.value).toBe("fret");
  });

  it("zet de datum van opmaak op vandaag en de plaats op Denderwindeke", () => {
    render(<OwnerReturnForm animalId={7} prefill={prefill} today="2026-09-12" />);
    expect((screen.getByLabelText(/Opgemaakt op/) as HTMLInputElement).value).toBe("2026-09-12");
    expect((screen.getByLabelText(/Opgemaakt te/) as HTMLInputElement).value).toBe("Denderwindeke");
  });

  it("heeft de velden van Sven's formulier voor de eigenaar en de kosten", () => {
    render(<OwnerReturnForm animalId={7} prefill={prefill} today="2026-09-12" />);
    for (const label of [/Familienaam/, /Voornaam/, /Straat en nummer/, /Postcode/, /Gemeente/, /Geboortedatum/, /Geboorteplaats/, /Telefoon/, /Gsm/, /E-mail/, /Verblijfskosten/, /Totaal betaald bedrag/]) {
      expect(screen.getAllByLabelText(label).length).toBeGreaterThan(0);
    }
    // Gesteriliseerd én stamboom hebben elk Ja/Nee — twee keer "Ja".
    expect(screen.getAllByRole("radio", { name: "Ja" })).toHaveLength(2);
  });

  it("stuurt het dier-ID verborgen mee", () => {
    const { container } = render(<OwnerReturnForm animalId={7} prefill={prefill} today="2026-09-12" />);
    const hidden = container.querySelector('input[name="animalId"]') as HTMLInputElement;
    expect(hidden.value).toBe("7");
  });

  it("toont veldfouten en zet de ingevulde waarden terug na een fout", () => {
    mockUseActionState.mockReturnValue([
      {
        success: false,
        fieldErrors: { ownerLastName: ["Familienaam is verplicht"] },
        values: { ...prefill, ownerFirstName: "An", ownerLastName: "", drawnUpOn: "2026-09-10", drawnUpAt: "Ninove", totalPaid: "45" },
      },
      vi.fn(),
      false,
    ]);
    render(<OwnerReturnForm animalId={7} prefill={prefill} today="2026-09-12" />);

    expect(screen.getByText("Familienaam is verplicht")).toBeInTheDocument();
    expect((screen.getByLabelText(/Voornaam/) as HTMLInputElement).value).toBe("An");
    expect((screen.getByLabelText(/Opgemaakt op/) as HTMLInputElement).value).toBe("2026-09-10");
    expect((screen.getByLabelText(/Totaal betaald bedrag/) as HTMLInputElement).value).toBe("45");
  });

  it("gaat na het opslaan naar de detailpagina van het formulier", () => {
    mockUseActionState.mockReturnValue([{ success: true, data: { id: 12 } }, vi.fn(), false]);
    render(<OwnerReturnForm animalId={7} prefill={prefill} today="2026-09-12" />);
    expect(mockPush).toHaveBeenCalledWith("/beheerder/dieren/7/terug-naar-eigenaar/12");
  });
});
