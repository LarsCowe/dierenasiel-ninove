// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import AnimalTable from "./AnimalTable";
import type { Animal } from "@/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/beheerder/dieren",
  useSearchParams: () => new URLSearchParams(),
}));

function mockAnimal(overrides: Partial<Animal> = {}): Animal {
  return {
    id: 1,
    name: "Rex",
    aliasName: null,
    slug: "rex",
    species: "hond",
    breed: "Mechelse Herder",
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

describe("AnimalTable — 'Reden van intake' kolom (Story 10.21)", () => {
  it("toont de nieuwe kolom direct na 'Intake datum' (positie 8)", () => {
    render(<AnimalTable animals={[mockAnimal()]} />);
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.trim());
    const intakeDateIdx = headers.findIndex((h) => h === "Intake datum");
    const intakeReasonIdx = headers.findIndex((h) => h === "Reden van intake");

    expect(intakeDateIdx).toBeGreaterThanOrEqual(0);
    expect(intakeReasonIdx).toBe(intakeDateIdx + 1);
  });

  it("rendert het juiste label voor elke intakeReason", () => {
    const animals = [
      mockAnimal({ id: 1, name: "Afstand-dier", intakeReason: "afstand" }),
      mockAnimal({ id: 2, name: "IBN-dier", intakeReason: "ibn" }),
      mockAnimal({ id: 3, name: "Zwerf-dier", intakeReason: "zwerfhond" }),
      mockAnimal({ id: 4, name: "Onbekend-dier", intakeReason: null }),
    ];
    render(<AnimalTable animals={animals} />);

    const rows = screen.getAllByRole("row").slice(1); // skip header
    expect(within(rows[0]).getByText("Afstand door eigenaar")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Inbeslagname (IBN)")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Vondeling")).toBeInTheDocument();
    // Dier zonder reden toont '—'
    const reasonCell4 = within(rows[3]).getAllByRole("cell").at(-1);
    expect(reasonCell4?.textContent?.trim()).toBe("—");
  });
});
