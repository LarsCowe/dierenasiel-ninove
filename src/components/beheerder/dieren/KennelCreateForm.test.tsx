// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import KennelCreateForm from "./KennelCreateForm";

vi.mock("@/lib/actions/kennels", () => ({
  createKennel: vi.fn(),
}));

describe("KennelCreateForm — knop-label (Story 10.24)", () => {
  it("toont '+ Nieuwe kennel toevoegen' als toggle-tekst (niet meer 'Nieuw vak')", () => {
    render(<KennelCreateForm />);
    expect(screen.getByText("+ Nieuwe kennel toevoegen")).toBeInTheDocument();
    expect(screen.queryByText("+ Nieuw vak toevoegen")).toBeNull();
  });
});
