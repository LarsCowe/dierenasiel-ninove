import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetSession,
  mockHasPermission,
  mockLogAudit,
  mockRevalidatePath,
  mockGetCampaignById,
  mockGetOccupiedCageNumbers,
  mockInsertValues,
  mockInsertReturning,
  mockInsert,
  mockUpdateWhere,
  mockUpdateSet,
  mockUpdate,
} = vi.hoisted(() => {
  const mockGetSession = vi.fn();
  const mockHasPermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  const mockGetCampaignById = vi.fn();
  const mockGetOccupiedCageNumbers = vi.fn();

  // insert chain: db.insert().values().returning()
  const mockInsertReturning = vi.fn();
  const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

  // update chain: db.update().set().where()
  const mockUpdateWhere = vi.fn();
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

  return {
    mockGetSession,
    mockHasPermission,
    mockLogAudit,
    mockRevalidatePath,
    mockGetCampaignById,
    mockGetOccupiedCageNumbers,
    mockInsertValues,
    mockInsertReturning,
    mockInsert,
    mockUpdateWhere,
    mockUpdateSet,
    mockUpdate,
  };
});

vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/permissions", () => ({ hasPermission: mockHasPermission }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/queries/stray-cat-campaigns", () => ({
  getCampaignById: mockGetCampaignById,
  getOccupiedCageNumbers: mockGetOccupiedCageNumbers,
}));
vi.mock("@/lib/db", () => ({
  db: { insert: mockInsert, update: mockUpdate },
}));
vi.mock("@/lib/db/schema", () => ({
  strayCatCampaigns: Symbol("strayCatCampaigns"),
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));

import {
  createCampaignAction,
  deployCagesAction,
  registerInspectionAction,
  completeCampaignAction,
  linkAnimalAction,
} from "./stray-cat-campaigns";

// Default: logged in beheerder with permission
function setupAuth() {
  mockGetSession.mockResolvedValue({ userId: 1, role: "beheerder" });
  mockHasPermission.mockReturnValue(true);
}

describe("createCampaignAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuth();
  });

  it("creates a campaign with status open", async () => {
    mockInsertReturning.mockResolvedValue([{ id: 1 }]);

    const result = await createCampaignAction({
      requestDate: "2026-03-01",
      municipality: "Ninove",
      address: "Kerkstraat 1",
    });

    expect(result).toEqual({ success: true, data: { id: 1 } });
    expect(mockInsert).toHaveBeenCalled();
    expect(mockLogAudit).toHaveBeenCalledWith(
      "stray_cat_campaign.created",
      "stray_cat_campaign",
      1,
      null,
      expect.objectContaining({ municipality: "Ninove" }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren/zwerfkattenbeleid");
  });

  it("rejects unauthenticated user", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await createCampaignAction({
      requestDate: "2026-03-01",
      municipality: "Ninove",
      address: "Kerkstraat 1",
    });

    expect(result).toEqual({ success: false, error: "Niet ingelogd" });
  });

  it("rejects user without permission", async () => {
    mockHasPermission.mockReturnValue(false);

    const result = await createCampaignAction({
      requestDate: "2026-03-01",
      municipality: "Ninove",
      address: "Kerkstraat 1",
    });

    expect(result).toEqual({ success: false, error: "Onvoldoende rechten" });
  });

  it("rejects invalid input", async () => {
    const result = await createCampaignAction({
      requestDate: "",
      municipality: "",
      address: "",
    });

    expect(result.success).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("deployCagesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuth();
    // Default: geen kooi bezet. Tests die uniekheid testen overschrijven dit.
    mockGetOccupiedCageNumbers.mockResolvedValue({});
  });

  it("deploys cages and updates status to kooien_geplaatst", async () => {
    mockGetCampaignById.mockResolvedValue({ id: 1, status: "open" });

    const result = await deployCagesAction({
      campaignId: 1,
      cageDeploymentDate: "2026-03-05",
      cageNumbers: "K1, K2",
    });

    expect(result).toEqual({ success: true, data: undefined });
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        cageDeploymentDate: "2026-03-05",
        cageNumbers: "K1, K2",
        status: "kooien_geplaatst",
      }),
    );
    expect(mockLogAudit).toHaveBeenCalled();
  });

  it("rejects if campaign not in open status", async () => {
    mockGetCampaignById.mockResolvedValue({ id: 1, status: "kooien_geplaatst" });

    const result = await deployCagesAction({
      campaignId: 1,
      cageDeploymentDate: "2026-03-05",
      cageNumbers: "K1",
    });

    expect(result).toEqual({ success: false, error: "Campagne moet status 'open' hebben" });
  });

  it("rejects if campaign not found", async () => {
    mockGetCampaignById.mockResolvedValue(null);

    const result = await deployCagesAction({
      campaignId: 999,
      cageDeploymentDate: "2026-03-05",
      cageNumbers: "K1",
    });

    expect(result).toEqual({ success: false, error: "Campagne niet gevonden" });
  });

  it("Story 10.7: rejects als een kooi al in gebruik is in andere lopende campagne", async () => {
    mockGetCampaignById.mockResolvedValue({ id: 5, status: "open" });
    mockGetOccupiedCageNumbers.mockResolvedValue({ K2: 3 });

    const result = await deployCagesAction({
      campaignId: 5,
      cageDeploymentDate: "2026-03-05",
      cageNumbers: "K1,K2,K3",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("K2");
      expect(result.error).toContain("#3");
    }
    // DB-update mag NIET gebeuren bij conflict
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("Story 10.7: slaagt wanneer geen enkele geselecteerde kooi bezet is", async () => {
    mockGetCampaignById.mockResolvedValue({ id: 5, status: "open" });
    mockGetOccupiedCageNumbers.mockResolvedValue({ K7: 2 });

    const result = await deployCagesAction({
      campaignId: 5,
      cageDeploymentDate: "2026-03-05",
      cageNumbers: "K1,K2",
    });

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("registerInspectionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuth();
  });

  it("registers inspection and updates status to in_behandeling", async () => {
    mockGetCampaignById.mockResolvedValue({ id: 1, status: "kooien_geplaatst" });

    const result = await registerInspectionAction({
      campaignId: 1,
      inspectionDate: "2026-03-10",
      catDescription: "Cyperse kater",
      vetName: "Dr. Nadia",
    });

    expect(result).toEqual({ success: true, data: undefined });
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        inspectionDate: "2026-03-10",
        catDescription: "Cyperse kater",
        vetName: "Dr. Nadia",
        status: "in_behandeling",
      }),
    );
  });

  it("rejects if campaign not in kooien_geplaatst status", async () => {
    mockGetCampaignById.mockResolvedValue({ id: 1, status: "open" });

    const result = await registerInspectionAction({
      campaignId: 1,
      inspectionDate: "2026-03-10",
      catDescription: "Kat",
      vetName: "Dr. Nadia",
    });

    expect(result).toEqual({ success: false, error: "Campagne moet status 'kooien_geplaatst' hebben" });
  });
});

describe("completeCampaignAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuth();
  });

  it("completes campaign and updates status to afgerond", async () => {
    mockGetCampaignById.mockResolvedValue({ id: 1, status: "in_behandeling" });

    const result = await completeCampaignAction({
      campaignId: 1,
      fivStatus: "negatief",
      felvStatus: "negatief",
      outcome: "gecastreerd_uitgezet",
    });

    expect(result).toEqual({ success: true, data: undefined });
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        fivStatus: "negatief",
        felvStatus: "negatief",
        outcome: "gecastreerd_uitgezet",
        status: "afgerond",
      }),
    );
  });

  it("rejects if campaign not in in_behandeling status", async () => {
    mockGetCampaignById.mockResolvedValue({ id: 1, status: "kooien_geplaatst" });

    const result = await completeCampaignAction({
      campaignId: 1,
      fivStatus: "negatief",
      felvStatus: "negatief",
      outcome: "gecastreerd_uitgezet",
    });

    expect(result).toEqual({ success: false, error: "Campagne moet status 'in_behandeling' hebben" });
  });

  it("rejects invalid fivStatus", async () => {
    mockGetCampaignById.mockResolvedValue({ id: 1, status: "in_behandeling" });

    const result = await completeCampaignAction({
      campaignId: 1,
      fivStatus: "onbekend" as never,
      felvStatus: "negatief",
      outcome: "gecastreerd_uitgezet",
    });

    expect(result.success).toBe(false);
  });
});

describe("linkAnimalAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAuth();
  });

  it("links an animal to a campaign", async () => {
    mockGetCampaignById.mockResolvedValue({ id: 1, status: "afgerond", outcome: "geadopteerd" });

    const result = await linkAnimalAction({ campaignId: 1, linkedAnimalId: 42 });

    expect(result).toEqual({ success: true, data: undefined });
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ linkedAnimalId: 42 }),
    );
    expect(mockLogAudit).toHaveBeenCalled();
  });

  it("rejects if campaign outcome is not geadopteerd", async () => {
    mockGetCampaignById.mockResolvedValue({ id: 1, status: "afgerond", outcome: "gecastreerd_uitgezet" });

    const result = await linkAnimalAction({ campaignId: 1, linkedAnimalId: 42 });

    expect(result).toEqual({ success: false, error: "Alleen campagnes met uitkomst 'geadopteerd' kunnen aan een dier gekoppeld worden" });
  });

  it("rejects invalid animalId", async () => {
    const result = await linkAnimalAction({ campaignId: 1, linkedAnimalId: 0 });

    expect(result.success).toBe(false);
  });
});
