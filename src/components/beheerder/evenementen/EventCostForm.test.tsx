// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import EventCostForm from "./EventCostForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/actions/event-costs", () => ({
  createEventCost: vi.fn(),
  updateEventCost: vi.fn(),
}));

// Story 13.16 — kiezen uit de leverancierslijst, of een nieuwe naam typen.
describe("EventCostForm — leverancier (Story 13.16)", () => {
  it("biedt de gekende leveranciers aan als keuzelijst bij het tekstveld", () => {
    render(
      <EventCostForm
        eventId={4}
        kind="kost"
        onDone={vi.fn()}
        supplierNames={["Brouwerij De Ryck", "Chiro Ninove"]}
      />,
    );
    const veld = screen.getByLabelText("Leverancier");
    const lijstId = veld.getAttribute("list");
    expect(lijstId).toBeTruthy();
    const opties = Array.from(document.getElementById(lijstId!)!.querySelectorAll("option")).map(
      (o) => o.getAttribute("value"),
    );
    expect(opties).toEqual(["Brouwerij De Ryck", "Chiro Ninove"]);
  });

  it("blijft een gewoon tekstveld zonder lijst", () => {
    render(<EventCostForm eventId={4} kind="kost" onDone={vi.fn()} />);
    expect(screen.getByLabelText("Leverancier")).toHaveAttribute("name", "supplier");
  });
});
