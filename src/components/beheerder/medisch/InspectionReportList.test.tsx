// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InspectionReportList from "./InspectionReportList";
import type { VetInspectionReport } from "@/types";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function mockReport(overrides: Partial<VetInspectionReport> = {}): VetInspectionReport {
  return {
    id: 1,
    visitDate: "2026-05-01",
    vetName: "Dr. Nadia",
    vetSignature: null,
    animalsTreated: [],
    animalsEuthanized: [],
    findings: null,
    recommendations: null,
    pdfUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as VetInspectionReport;
}

function getRow(name: RegExp): HTMLElement {
  return screen.getAllByRole("link", { name }).find((el) => el.tagName === "TR")!;
}

describe("InspectionReportList — klikbare rij (Story 10.22)", () => {
  beforeEach(() => mockPush.mockClear());

  it("navigeert naar /beheerder/medisch/bezoekrapport/[id] bij klik op data-cel", () => {
    render(<InspectionReportList reports={[mockReport({ id: 42 })]} />);
    const row = getRow(/Dr\. Nadia/);
    fireEvent.click(row);
    expect(mockPush).toHaveBeenCalledWith("/beheerder/medisch/bezoekrapport/42");
  });

  it("rij heeft tabIndex=0 en aria-label met dierenarts-naam", () => {
    render(<InspectionReportList reports={[mockReport({ id: 9, vetName: "Dr. Smit" })]} />);
    const row = getRow(/Dr\. Smit/);
    expect(row.getAttribute("tabindex")).toBe("0");
    expect(row.getAttribute("aria-label")).toMatch(/Dr\. Smit/);
  });

  it("klik op 'Bekijken'-link triggert GEEN dubbele navigatie", () => {
    render(<InspectionReportList reports={[mockReport()]} />);
    const link = screen.getByRole("link", { name: "Bekijken" });
    fireEvent.click(link);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
