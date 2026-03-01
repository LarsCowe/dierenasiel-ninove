import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetSession,
  mockHasPermission,
  mockLogAudit,
  mockRevalidatePath,
  mockAnonymizeAdoptionCandidate,
  mockAnonymizeWalker,
  mockGetCandidateExportData,
  mockGetWalkerExportData,
  mockFormatCandidateExportJson,
  mockFormatCandidateExportCsv,
  mockFormatWalkerExportJson,
  mockFormatWalkerExportCsv,
} = vi.hoisted(() => {
  return {
    mockGetSession: vi.fn(),
    mockHasPermission: vi.fn(),
    mockLogAudit: vi.fn(),
    mockRevalidatePath: vi.fn(),
    mockAnonymizeAdoptionCandidate: vi.fn(),
    mockAnonymizeWalker: vi.fn(),
    mockGetCandidateExportData: vi.fn(),
    mockGetWalkerExportData: vi.fn(),
    mockFormatCandidateExportJson: vi.fn(),
    mockFormatCandidateExportCsv: vi.fn(),
    mockFormatWalkerExportJson: vi.fn(),
    mockFormatWalkerExportCsv: vi.fn(),
  };
});

vi.mock("@/lib/auth/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("@/lib/permissions", () => ({
  hasPermission: mockHasPermission,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@/lib/gdpr/anonymize", () => ({
  anonymizeAdoptionCandidate: mockAnonymizeAdoptionCandidate,
  anonymizeWalker: mockAnonymizeWalker,
}));

vi.mock("@/lib/gdpr/export", () => ({
  getCandidateExportData: mockGetCandidateExportData,
  getWalkerExportData: mockGetWalkerExportData,
  formatCandidateExportJson: mockFormatCandidateExportJson,
  formatCandidateExportCsv: mockFormatCandidateExportCsv,
  formatWalkerExportJson: mockFormatWalkerExportJson,
  formatWalkerExportCsv: mockFormatWalkerExportCsv,
}));

import {
  anonymizeCandidateAction,
  anonymizeWalkerAction,
  exportCandidateDataAction,
  exportWalkerDataAction,
} from "./gdpr";

const mockSession = { userId: 1, role: "beheerder", email: "admin@test.com" };

const mockOldCandidate = {
  id: 1,
  firstName: "Jan",
  lastName: "Janssens",
  email: "jan@example.com",
};

const mockOldWalker = {
  id: 5,
  firstName: "Marie",
  lastName: "Peeters",
  email: "marie@example.com",
};

describe("anonymizeCandidateAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockHasPermission.mockReturnValue(true);
    mockLogAudit.mockResolvedValue(undefined);
    mockAnonymizeAdoptionCandidate.mockResolvedValue(mockOldCandidate);
  });

  it("returns error when not logged in", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await anonymizeCandidateAction(1);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Niet ingelogd");
  });

  it("returns error when missing gdpr:write permission", async () => {
    mockHasPermission.mockReturnValue(false);

    const result = await anonymizeCandidateAction(1);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("rechten");
    expect(mockHasPermission).toHaveBeenCalledWith("beheerder", "gdpr:write");
  });

  it("returns error for invalid candidateId", async () => {
    const result = await anonymizeCandidateAction(0);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Ongeldig");
  });

  it("returns error when candidate not found or already anonymised", async () => {
    mockAnonymizeAdoptionCandidate.mockResolvedValue(null);

    const result = await anonymizeCandidateAction(999);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("niet gevonden");
  });

  it("calls anonymizeAdoptionCandidate and logAudit on success", async () => {
    const result = await anonymizeCandidateAction(1);

    expect(result.success).toBe(true);
    expect(mockAnonymizeAdoptionCandidate).toHaveBeenCalledWith(1);
    expect(mockLogAudit).toHaveBeenCalledWith(
      "gdpr.anonymise_candidate",
      "adoption_candidate",
      1,
      mockOldCandidate,
      expect.objectContaining({ anonymisedAt: expect.any(String) }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/gdpr");
  });

  it("returns success message on completion", async () => {
    const result = await anonymizeCandidateAction(1);

    expect(result.success).toBe(true);
    if (result.success) expect(result.message).toContain("geanonimiseerd");
  });

  it("catches errors and returns error result", async () => {
    mockAnonymizeAdoptionCandidate.mockRejectedValue(new Error("DB error"));

    const result = await anonymizeCandidateAction(1);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("iets mis");
  });
});

describe("anonymizeWalkerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockHasPermission.mockReturnValue(true);
    mockLogAudit.mockResolvedValue(undefined);
    mockAnonymizeWalker.mockResolvedValue(mockOldWalker);
  });

  it("returns error when not logged in", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await anonymizeWalkerAction(5);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Niet ingelogd");
  });

  it("returns error when missing gdpr:write permission", async () => {
    mockHasPermission.mockReturnValue(false);

    const result = await anonymizeWalkerAction(5);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("rechten");
  });

  it("calls anonymizeWalker and logAudit on success", async () => {
    const result = await anonymizeWalkerAction(5);

    expect(result.success).toBe(true);
    expect(mockAnonymizeWalker).toHaveBeenCalledWith(5);
    expect(mockLogAudit).toHaveBeenCalledWith(
      "gdpr.anonymise_walker",
      "walker",
      5,
      mockOldWalker,
      expect.objectContaining({ anonymisedAt: expect.any(String) }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/gdpr");
  });
});

// === Export actions ===

const mockCandidateExportData = { id: 1, firstName: "Jan", lastName: "Janssens" };
const mockWalkerExportData = { id: 5, firstName: "Marie", lastName: "Peeters" };

describe("exportCandidateDataAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockHasPermission.mockReturnValue(true);
    mockLogAudit.mockResolvedValue(undefined);
    mockGetCandidateExportData.mockResolvedValue(mockCandidateExportData);
    mockFormatCandidateExportJson.mockReturnValue('{"test":"json"}');
    mockFormatCandidateExportCsv.mockReturnValue("test,csv");
  });

  it("returns error when not logged in", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await exportCandidateDataAction(1, "json");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Niet ingelogd");
  });

  it("returns error when missing gdpr:read permission", async () => {
    mockHasPermission.mockReturnValue(false);

    const result = await exportCandidateDataAction(1, "json");

    expect(result.success).toBe(false);
    expect(mockHasPermission).toHaveBeenCalledWith("beheerder", "gdpr:read");
  });

  it("returns error for invalid candidateId", async () => {
    const result = await exportCandidateDataAction(0, "json");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Ongeldig");
  });

  it("returns error when candidate not found", async () => {
    mockGetCandidateExportData.mockResolvedValue(null);

    const result = await exportCandidateDataAction(999, "json");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("niet gevonden");
  });

  it("exports as JSON and logs audit", async () => {
    const result = await exportCandidateDataAction(1, "json");

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('{"test":"json"}');
    expect(mockFormatCandidateExportJson).toHaveBeenCalledWith(mockCandidateExportData);
    expect(mockLogAudit).toHaveBeenCalledWith(
      "gdpr.export_candidate",
      "adoption_candidate",
      1,
      null,
      expect.objectContaining({ format: "json" }),
    );
  });

  it("exports as CSV and logs audit", async () => {
    const result = await exportCandidateDataAction(1, "csv");

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("test,csv");
    expect(mockFormatCandidateExportCsv).toHaveBeenCalledWith(mockCandidateExportData);
    expect(mockLogAudit).toHaveBeenCalledWith(
      "gdpr.export_candidate",
      "adoption_candidate",
      1,
      null,
      expect.objectContaining({ format: "csv" }),
    );
  });

  it("catches errors and returns error result", async () => {
    mockGetCandidateExportData.mockRejectedValue(new Error("DB error"));

    const result = await exportCandidateDataAction(1, "json");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("iets mis");
  });
});

describe("exportWalkerDataAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockHasPermission.mockReturnValue(true);
    mockLogAudit.mockResolvedValue(undefined);
    mockGetWalkerExportData.mockResolvedValue(mockWalkerExportData);
    mockFormatWalkerExportJson.mockReturnValue('{"test":"walker"}');
    mockFormatWalkerExportCsv.mockReturnValue("walker,csv");
  });

  it("returns error when not logged in", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await exportWalkerDataAction(5, "json");

    expect(result.success).toBe(false);
  });

  it("exports walker as JSON and logs audit", async () => {
    const result = await exportWalkerDataAction(5, "json");

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('{"test":"walker"}');
    expect(mockLogAudit).toHaveBeenCalledWith(
      "gdpr.export_walker",
      "walker",
      5,
      null,
      expect.objectContaining({ format: "json" }),
    );
  });

  it("exports walker as CSV", async () => {
    const result = await exportWalkerDataAction(5, "csv");

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("walker,csv");
    expect(mockFormatWalkerExportCsv).toHaveBeenCalledWith(mockWalkerExportData);
  });

  it("returns error when walker not found", async () => {
    mockGetWalkerExportData.mockResolvedValue(null);

    const result = await exportWalkerDataAction(999, "json");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("niet gevonden");
  });
});
