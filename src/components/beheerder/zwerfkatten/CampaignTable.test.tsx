// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CampaignTable from "./CampaignTable";
import type { StrayCatCampaign } from "@/types";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function mockCampaign(overrides: Partial<StrayCatCampaign> = {}): StrayCatCampaign {
  return {
    id: 1,
    requestDate: "2026-04-01",
    requesterName: null,
    requesterEmail: null,
    requesterPhone: null,
    municipality: "Ninove",
    municipalityLogoId: null,
    address: "Centrumlaan 100",
    status: "open",
    outcome: null,
    cageDeploymentDate: null,
    cageNumbers: null,
    notes: null,
    createdBy: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as StrayCatCampaign;
}

describe("CampaignTable — klikbare rij (Story 10.22 refactor naar shared hook)", () => {
  beforeEach(() => mockPush.mockClear());

  it("navigeert naar campagne-detail bij klik op rij", () => {
    render(<CampaignTable campaigns={[mockCampaign({ id: 42 })]} />);
    const row = screen.getAllByRole("link").find((el) => el.tagName === "TR")!;
    fireEvent.click(row);
    expect(mockPush).toHaveBeenCalledWith("/beheerder/dieren/zwerfkattenbeleid/42");
  });

  it("navigeert bij Enter op gefocuste rij", () => {
    render(<CampaignTable campaigns={[mockCampaign({ id: 7 })]} />);
    const row = screen.getAllByRole("link").find((el) => el.tagName === "TR")!;
    fireEvent.keyDown(row, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/beheerder/dieren/zwerfkattenbeleid/7");
  });

  it("rij heeft role='link' en tabIndex=0", () => {
    render(<CampaignTable campaigns={[mockCampaign({ id: 1 })]} />);
    const row = screen.getAllByRole("link").find((el) => el.tagName === "TR")!;
    expect(row.getAttribute("tabindex")).toBe("0");
  });
});
