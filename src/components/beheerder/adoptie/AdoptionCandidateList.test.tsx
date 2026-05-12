// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AdoptionCandidateList from "./AdoptionCandidateList";
import type { AdoptionCandidateWithAnimal } from "@/lib/queries/adoption-candidates";

const { mockPush, mockRefresh, mockDelete } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("@/lib/actions/adoption-candidates", () => ({
  hardDeleteAdoptionCandidate: mockDelete,
}));

function mockCandidate(
  overrides: Partial<AdoptionCandidateWithAnimal> = {},
): AdoptionCandidateWithAnimal {
  return {
    id: 1,
    firstName: "Anna",
    lastName: "Peeters",
    email: "anna@example.com",
    phone: null,
    address: null,
    postalCode: null,
    city: null,
    birthDate: null,
    species: "hond",
    animalId: 10,
    animalName: "Rex",
    interestNotes: null,
    livingSituation: null,
    hasGarden: null,
    workSituation: null,
    hasChildren: null,
    hasOtherAnimals: null,
    childrenAges: null,
    otherAnimalsDescription: null,
    walkingExperience: null,
    referralSource: null,
    consentDataSharing: true,
    consentInternalUse: true,
    reviewMartine: null,
    reviewNathalie: null,
    reviewSven: null,
    martineNote: null,
    nathalieNote: null,
    svenNote: null,
    summary: null,
    category: "blanco",
    archivedAt: null,
    rejectionReason: null,
    blacklistMatch: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as AdoptionCandidateWithAnimal;
}

function getRow(name: RegExp): HTMLElement {
  return screen.getAllByRole("link", { name }).find((el) => el.tagName === "TR")!;
}

describe("AdoptionCandidateList — klikbare rij (Story 10.22)", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockRefresh.mockClear();
    mockDelete.mockClear();
  });

  it("navigeert naar /beheerder/adoptie/[id] bij klik op een data-cel", () => {
    render(<AdoptionCandidateList candidates={[mockCandidate({ id: 42 })]} />);
    const row = getRow(/Anna Peeters/);
    fireEvent.click(row);
    expect(mockPush).toHaveBeenCalledWith("/beheerder/adoptie/42");
  });

  it("rij heeft role='link', tabIndex=0 en aria-label", () => {
    render(<AdoptionCandidateList candidates={[mockCandidate({ id: 9 })]} />);
    const row = getRow(/Anna Peeters/);
    expect(row.getAttribute("tabindex")).toBe("0");
    expect(row.getAttribute("aria-label")).toMatch(/Anna Peeters/);
  });

  it("klik op delete-knop triggert geen rij-navigatie", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false); // skip echte delete
    render(<AdoptionCandidateList candidates={[mockCandidate({ id: 5 })]} />);
    const deleteBtn = screen.getByTitle("Definitief verwijderen");
    fireEvent.click(deleteBtn);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("klik op 'Bekijken'-link triggert geen dubbele navigatie", () => {
    render(<AdoptionCandidateList candidates={[mockCandidate()]} />);
    const link = screen.getByRole("link", { name: "Bekijken" });
    fireEvent.click(link);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
