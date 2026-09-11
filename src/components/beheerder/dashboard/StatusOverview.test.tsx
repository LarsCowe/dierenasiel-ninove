// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusOverview from "./StatusOverview";

// Story 10.62: de emmer telt beschikbare dieren die nog niet adopteerbaar zijn
// (isAvailableForAdoption = false). Sven's woord daarvoor is "adopteerbaar".
describe("StatusOverview — emmer (nog) niet adopteerbaar (Story 10.62)", () => {
  it("toont de emmer als '(Nog) niet adopteerbaar'", () => {
    render(<StatusOverview statuses={[{ status: "niet_ter_adoptie", count: 3 }]} />);
    expect(screen.getByText("(Nog) niet adopteerbaar")).toBeInTheDocument();
    expect(screen.queryByText("Niet ter adoptie")).toBeNull();
  });
});
