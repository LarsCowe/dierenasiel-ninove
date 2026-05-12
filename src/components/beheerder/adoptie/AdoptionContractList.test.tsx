// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AdoptionContractList from "./AdoptionContractList";
import type { ContractListItem } from "@/lib/queries/adoption-contracts";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function mockContract(overrides: Partial<ContractListItem> = {}): ContractListItem {
  return {
    id: 1,
    contractDate: "2026-05-01",
    candidateFirstName: "Anna",
    candidateLastName: "Peeters",
    animalId: 100,
    animalName: "Rex",
    animalSpecies: "hond",
    paymentAmount: "150.00",
    status: "draft",
    signedDocumentUrl: null,
    ...overrides,
  } as ContractListItem;
}

function getRow(name: RegExp): HTMLElement {
  return screen.getAllByRole("link", { name }).find((el) => el.tagName === "TR")!;
}

describe("AdoptionContractList — klikbare rij (Story 10.22)", () => {
  beforeEach(() => mockPush.mockClear());

  it("navigeert naar /beheerder/adoptie/contracten/[id] bij klik op data-cel", () => {
    render(<AdoptionContractList contracts={[mockContract({ id: 42 })]} />);
    const row = getRow(/Anna Peeters/);
    fireEvent.click(row);
    expect(mockPush).toHaveBeenCalledWith("/beheerder/adoptie/contracten/42");
  });

  it("rij heeft role='link', tabIndex=0 en aria-label met adoptant + dier", () => {
    render(
      <AdoptionContractList
        contracts={[mockContract({ id: 9, candidateFirstName: "Anna", animalName: "Rex" })]}
      />,
    );
    const row = getRow(/Anna/);
    expect(row.getAttribute("tabindex")).toBe("0");
    expect(row.getAttribute("aria-label")).toMatch(/Anna/);
  });

  it("klik op de Link naar het dier (andere URL) triggert GEEN rij-navigatie", () => {
    render(<AdoptionContractList contracts={[mockContract({ animalId: 100 })]} />);
    const dierLink = screen.getByRole("link", { name: "Rex" });
    fireEvent.click(dierLink);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("klik op externe PDF-link triggert GEEN rij-navigatie", () => {
    render(
      <AdoptionContractList
        contracts={[mockContract({ signedDocumentUrl: "https://example.com/contract.pdf" })]}
      />,
    );
    const pdfLink = screen.getByRole("link", { name: "Bekijken" });
    fireEvent.click(pdfLink);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("klik op 'Beheer'-link triggert GEEN dubbele navigatie", () => {
    render(<AdoptionContractList contracts={[mockContract({ id: 5 })]} />);
    const beheerLink = screen.getByRole("link", { name: "Beheer" });
    fireEvent.click(beheerLink);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
