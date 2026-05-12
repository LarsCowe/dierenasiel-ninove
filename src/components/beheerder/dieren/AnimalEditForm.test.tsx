// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AnimalEditForm from "./AnimalEditForm";
import type { Animal } from "@/types";

vi.mock("@/lib/actions/animals", () => ({
  updateAnimal: vi.fn(),
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
