// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WalkerList from "./WalkerList";
import type { Walker } from "@/types";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function mockWalker(overrides: Partial<Walker> = {}): Walker {
  return {
    id: 1,
    firstName: "Jan",
    lastName: "Janssens",
    email: "jan@example.com",
    phone: "0470/12.34.56",
    address: null,
    postalCode: null,
    city: null,
    barcode: "WALK-001",
    photoUrl: null,
    status: "approved",
    rejectionReason: null,
    notes: null,
    membershipExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Walker;
}

function getRow(name: RegExp): HTMLElement {
  return screen.getAllByRole("link", { name }).find((el) => el.tagName === "TR")!;
}

describe("WalkerList — klikbare rij (Story 10.22)", () => {
  beforeEach(() => mockPush.mockClear());

  it("navigeert naar detail-pagina bij klik op data-cel", () => {
    render(<WalkerList walkers={[mockWalker({ id: 42, firstName: "Jan", lastName: "Janssens" })]} />);
    const row = getRow(/Jan Janssens/);
    fireEvent.click(row);
    expect(mockPush).toHaveBeenCalledWith("/beheerder/wandelaars/42");
  });

  it("navigeert bij Enter op gefocuste rij", () => {
    render(<WalkerList walkers={[mockWalker({ id: 7 })]} />);
    const row = getRow(/Jan Janssens/);
    fireEvent.keyDown(row, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/beheerder/wandelaars/7");
  });

  it("rij heeft role='link', tabIndex=0 en aria-label met de naam", () => {
    render(<WalkerList walkers={[mockWalker({ id: 9, firstName: "Anna", lastName: "Peeters" })]} />);
    const row = getRow(/Anna Peeters/);
    expect(row.getAttribute("tabindex")).toBe("0");
    expect(row.getAttribute("aria-label")).toMatch(/Anna Peeters/);
  });

  it("klik op de bestaande 'Bekijken'-link triggert geen dubbele navigatie", () => {
    render(<WalkerList walkers={[mockWalker({ id: 5 })]} />);
    // De "Bekijken"-Link in de actie-cel is een <a> → stop-propagation in hook.
    const bekijkLink = screen.getByRole("link", { name: "Bekijken" });
    fireEvent.click(bekijkLink);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
