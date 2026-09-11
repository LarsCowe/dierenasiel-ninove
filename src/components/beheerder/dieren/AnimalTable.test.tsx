// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import AnimalTable from "./AnimalTable";
import type { AdminAnimalListItem } from "@/lib/queries/animals";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/beheerder/dieren",
  useSearchParams: () => new URLSearchParams(),
}));

function mockAnimal(overrides: Partial<AdminAnimalListItem> = {}): AdminAnimalListItem {
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
    kennelCode: null,
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
  } as AdminAnimalListItem;
}

describe("AnimalTable — klikbare rij (Story 10.22)", () => {
  beforeEach(() => mockPush.mockClear());

  it("navigeert naar detail-pagina bij klik op een data-cel", () => {
    render(<AnimalTable animals={[mockAnimal({ id: 42, name: "Rex" })]} />);
    const dataRow = screen.getAllByRole("link", { name: /Rex/ }).find((el) => el.tagName === "TR")!;
    const cells = within(dataRow).getAllByRole("cell");
    fireEvent.click(cells[1]); // Soort-cel, niet de naam-link
    expect(mockPush).toHaveBeenCalledWith("/beheerder/dieren/42");
  });

  it("navigeert bij Enter op gefocuste rij", () => {
    render(<AnimalTable animals={[mockAnimal({ id: 7, name: "Rex" })]} />);
    const dataRow = screen.getAllByRole("link", { name: /Rex/ }).find((el) => el.tagName === "TR")!;
    fireEvent.keyDown(dataRow, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/beheerder/dieren/7");
  });

  it("header-rij is niet klikbaar (alleen data-rijen)", () => {
    render(<AnimalTable animals={[mockAnimal()]} />);
    const headerRow = screen.getByRole("row"); // alleen header heeft role=row
    fireEvent.click(headerRow);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("rij heeft role='link', tabIndex=0 en aria-label met de diernaam", () => {
    render(<AnimalTable animals={[mockAnimal({ id: 9, name: "Mimi" })]} />);
    const dataRow = screen.getAllByRole("link", { name: /Mimi/ }).find((el) => el.tagName === "TR")!;
    expect(dataRow.getAttribute("tabindex")).toBe("0");
    expect(dataRow.getAttribute("aria-label")).toMatch(/Mimi/);
  });
});

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

    const dataRows = screen.getAllByRole("link").filter((el) => el.tagName === "TR");
    expect(within(dataRows[0]).getByText("Afstand door eigenaar")).toBeInTheDocument();
    expect(within(dataRows[1]).getByText("Inbeslagname (IBN)")).toBeInTheDocument();
    expect(within(dataRows[2]).getByText("Vondeling")).toBeInTheDocument();
    // Dier zonder reden toont '—'
    const reasonCell4 = within(dataRows[3]).getAllByRole("cell").at(-1);
    expect(reasonCell4?.textContent?.trim()).toBe("—");
  });
});

describe("AnimalTable — kolom Adopteerbaar (Story 10.62)", () => {
  it("noemt de kolom voor isAvailableForAdoption 'Adopteerbaar', niet 'Ter adoptie'", () => {
    render(<AnimalTable animals={[mockAnimal()]} />);
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.trim());
    expect(headers).toContain("Adopteerbaar");
    expect(headers).not.toContain("Ter adoptie");
  });
});

describe("AnimalTable — kolom Kennel (Story 10.61)", () => {
  function kennelCell(name: string) {
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.trim());
    const kennelIdx = headers.indexOf("Kennel");
    const row = screen.getAllByRole("link", { name: new RegExp(name) }).find((el) => el.tagName === "TR")!;
    return within(row).getAllByRole("cell")[kennelIdx];
  }

  it("toont de kennelcode, niet het interne kennelnummer", () => {
    render(<AnimalTable animals={[mockAnimal({ name: "Nel", kennelId: 63, kennelCode: "H17" })]} />);
    expect(kennelCell("Nel").textContent?.trim()).toBe("H17");
  });

  it("toont '—' voor een dier zonder kennel", () => {
    render(<AnimalTable animals={[mockAnimal({ name: "Milka", kennelId: null, kennelCode: null })]} />);
    expect(kennelCell("Milka").textContent?.trim()).toBe("—");
  });
});
