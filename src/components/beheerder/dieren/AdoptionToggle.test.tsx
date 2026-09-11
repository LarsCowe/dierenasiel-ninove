// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdoptionToggle from "./AdoptionToggle";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/actions/animals-status", () => ({
  toggleAdoptionAvailability: vi.fn(),
}));

// Story 10.62: Sven — "adopteerbaar" = alles klaar voor adoptie, ook als het nog niet online staat.
describe("AdoptionToggle — benaming (Story 10.62)", () => {
  it("de schakelaar heet 'Adopteerbaar'", () => {
    render(<AdoptionToggle animalId={1} isAvailable={false} />);
    expect(screen.getByRole("checkbox", { name: "Adopteerbaar" })).toBeInTheDocument();
    expect(screen.queryByText("Beschikbaar voor adoptie")).toBeNull();
  });

  it("legt uit wat het betekent wanneer het aan staat", () => {
    render(<AdoptionToggle animalId={1} isAvailable={true} />);
    expect(screen.getByText(/klaar voor adoptie/i)).toBeInTheDocument();
  });
});
