// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AnimalEditForm from "./AnimalEditForm";
import type { Animal } from "@/types";

vi.mock("@/lib/actions/animals", () => ({
  updateAnimal: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

function mockAnimal(overrides: Partial<Animal> = {}): Animal {
  return {
    id: 1,
    name: "Rex",
    aliasName: null,
    slug: "rex",
    species: "hond",
    breed: null,
    gender: "reu",
    dateOfBirth: null,
    isNeutered: false,
    neuteredDate: null,
    neuteredByShelter: null,
    description: null,
    shortDescription: null,
    imageUrl: null,
    images: null,
    status: "beschikbaar",
    badge: null,
    isFeatured: false,
    color: null,
    identificationNr: null,
    isNewChip: false,
    passportNr: null,
    isNewPassport: false,
    barcode: null,
    isAvailableForAdoption: true,
    isOnWebsite: false,
    isInShelter: true,
    kennelId: null,
    intakeDate: "2026-05-01",
    intakeReason: null,
    isPickedUpByShelter: false,
    intakeMetadata: null,
    adoptedDate: null,
    dossierNr: null,
    pvNr: null,
    ibnDecisionDeadline: null,
    workflowPhase: "intake",
    outtakeDate: null,
    outtakeReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Animal;
}

function getReasonSelect(): HTMLSelectElement {
  return screen.getByLabelText("Reden intake") as HTMLSelectElement;
}

describe("AnimalEditForm — intake reason dropdown (Story 10.21)", () => {
  it("toont exact 3 opties (+ placeholder) met de juiste labels", () => {
    render(<AnimalEditForm animal={mockAnimal()} />);
    const select = getReasonSelect();
    const values = Array.from(select.options).map((o) => o.value);
    const labels = Array.from(select.options).map((o) => o.text);

    expect(values).toEqual(["", "afstand", "ibn", "zwerfhond"]);
    expect(labels).toEqual([
      "Niet opgegeven",
      "Afstand door eigenaar",
      "Inbeslagname (IBN)",
      "Vondeling",
    ]);
  });

  it("bevat geen legacy waarden 'vondeling' of 'overig' meer", () => {
    render(<AnimalEditForm animal={mockAnimal()} />);
    const select = getReasonSelect();
    const values = Array.from(select.options).map((o) => o.value);

    expect(values).not.toContain("vondeling");
    expect(values).not.toContain("overig");
  });

  it("preselecteert de bestaande intakeReason uit het dier", () => {
    render(<AnimalEditForm animal={mockAnimal({ intakeReason: "afstand" })} />);
    expect(getReasonSelect().value).toBe("afstand");
  });

  it("preselecteert de lege placeholder wanneer intakeReason null is", () => {
    render(<AnimalEditForm animal={mockAnimal({ intakeReason: null })} />);
    expect(getReasonSelect().value).toBe("");
  });
});

describe("AnimalEditForm — sterilisatie detail (Story 10.23)", () => {
  function getIsNeuteredCheckbox(): HTMLInputElement {
    return screen.getByLabelText("Gesteriliseerd / Gecastreerd") as HTMLInputElement;
  }

  it("toont GEEN datum/bron-velden wanneer isNeutered=false", () => {
    render(<AnimalEditForm animal={mockAnimal({ isNeutered: false })} />);
    expect(screen.queryByLabelText(/Datum sterilisatie/i)).toBeNull();
    expect(screen.queryByLabelText(/Door het asiel/i)).toBeNull();
  });

  it("toont datum + bron-velden wanneer isNeutered=true", () => {
    render(<AnimalEditForm animal={mockAnimal({ isNeutered: true })} />);
    expect(screen.getByLabelText(/Datum sterilisatie/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Door het asiel/i)).toBeInTheDocument();
  });

  it("toont velden zodra de gebruiker isNeutered aanvinkt", () => {
    render(<AnimalEditForm animal={mockAnimal({ isNeutered: false })} />);
    expect(screen.queryByLabelText(/Datum sterilisatie/i)).toBeNull();
    fireEvent.click(getIsNeuteredCheckbox());
    expect(screen.getByLabelText(/Datum sterilisatie/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Door het asiel/i)).toBeInTheDocument();
  });

  it("pre-fillt datum en door-asiel uit het dier", () => {
    render(
      <AnimalEditForm
        animal={mockAnimal({
          isNeutered: true,
          neuteredDate: "2024-03-15",
          neuteredByShelter: true,
        })}
      />,
    );
    const dateInput = screen.getByLabelText(/Datum sterilisatie/i) as HTMLInputElement;
    const byShelterCheckbox = screen.getByLabelText(/Door het asiel/i) as HTMLInputElement;
    expect(dateInput.value).toBe("2024-03-15");
    expect(byShelterCheckbox.checked).toBe(true);
  });

  it("door-asiel checkbox is unchecked wanneer neuteredByShelter=false", () => {
    render(
      <AnimalEditForm
        animal={mockAnimal({
          isNeutered: true,
          neuteredDate: "2024-03-15",
          neuteredByShelter: false,
        })}
      />,
    );
    const byShelterCheckbox = screen.getByLabelText(/Door het asiel/i) as HTMLInputElement;
    expect(byShelterCheckbox.checked).toBe(false);
  });
});
