// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PostAdoptionFollowupList from "./PostAdoptionFollowupList";
import type { FollowupOverviewRow } from "@/lib/queries/post-adoption-followups";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function mockRow(overrides: Partial<FollowupOverviewRow> = {}): FollowupOverviewRow {
  const base: FollowupOverviewRow = {
    followup: {
      id: 1,
      followupType: "1_week",
      date: "2026-06-01",
      status: "gepland",
      contractId: 100,
      notes: null,
    },
    animal: { id: 10, name: "Rex", species: "hond" },
    candidate: { id: 50, firstName: "Anna", lastName: "Peeters", phone: "0470/12.34.56" },
  };
  return {
    ...base,
    ...overrides,
    followup: { ...base.followup, ...(overrides.followup ?? {}) },
    animal: { ...base.animal, ...(overrides.animal ?? {}) },
    candidate: { ...base.candidate, ...(overrides.candidate ?? {}) },
  };
}

function getRow(name: RegExp): HTMLElement {
  return screen.getAllByRole("link", { name }).find((el) => el.tagName === "TR")!;
}

describe("PostAdoptionFollowupList — klikbare rij (Story 10.22)", () => {
  beforeEach(() => mockPush.mockClear());

  it("navigeert naar /beheerder/adoptie/[candidateId] bij klik op data-cel", () => {
    render(<PostAdoptionFollowupList rows={[mockRow({ candidate: { id: 77, firstName: "Anna", lastName: "Peeters", phone: null } })]} />);
    const row = getRow(/Anna Peeters/);
    fireEvent.click(row);
    expect(mockPush).toHaveBeenCalledWith("/beheerder/adoptie/77");
  });

  it("rij heeft role='link', tabIndex=0 en aria-label", () => {
    render(<PostAdoptionFollowupList rows={[mockRow()]} />);
    const row = getRow(/Anna Peeters/);
    expect(row.getAttribute("tabindex")).toBe("0");
    expect(row.getAttribute("aria-label")).toMatch(/Anna Peeters/);
  });

  it("klik op 'Bekijken'-link triggert GEEN dubbele navigatie", () => {
    render(<PostAdoptionFollowupList rows={[mockRow()]} />);
    const link = screen.getByRole("link", { name: "Bekijken" });
    fireEvent.click(link);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("toont 'geen opvolgingen'-melding bij lege lijst", () => {
    render(<PostAdoptionFollowupList rows={[]} />);
    expect(screen.getByText(/Geen geplande opvolgingen/i)).toBeInTheDocument();
  });
});
