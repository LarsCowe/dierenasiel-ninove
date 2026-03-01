import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetSession, mockGetAnimalReport } = vi.hoisted(() => {
  const mockGetSession = vi.fn();
  const mockGetAnimalReport = vi.fn();
  return { mockGetSession, mockGetAnimalReport };
});

vi.mock("@/lib/auth/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("@/lib/queries/reports", () => ({
  getAnimalReport: mockGetAnimalReport,
}));

import { exportAnimalReportCsv } from "./report-export";

const mockAnimals = [
  {
    id: 1, name: "Rex", species: "hond", breed: "Labrador", gender: "reu",
    status: "beschikbaar", workflowPhase: "verblijf", intakeDate: "2025-12-01",
    identificationNr: "981000000000001", kennelId: 1,
  },
  {
    id: 2, name: "Mimi", species: "kat", breed: "Europees", gender: "poes",
    status: "gereserveerd", workflowPhase: "medisch", intakeDate: "2026-01-10",
    identificationNr: null, kennelId: null,
  },
];

describe("exportAnimalReportCsv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 1, role: "beheerder", email: "admin@test.com", name: "Admin" });
    mockGetAnimalReport.mockResolvedValue({ animals: mockAnimals, total: 2 });
  });

  it("returns error when not logged in", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await exportAnimalReportCsv({});

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("niet ingelogd");
  });

  it("returns error when user has no report permission", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "wandelaar", email: "w@test.com", name: "W" });

    const result = await exportAnimalReportCsv({});

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("rechten");
  });

  it("generates CSV with correct headers", async () => {
    const result = await exportAnimalReportCsv({});

    expect(result.success).toBe(true);
    if (result.success) {
      const lines = result.data.split("\n");
      expect(lines[0]).toBe("Naam,Soort,Ras,Geslacht,Status,Workflow-fase,Chipnr,Intake datum");
    }
  });

  it("generates CSV with correct data rows", async () => {
    const result = await exportAnimalReportCsv({});

    expect(result.success).toBe(true);
    if (result.success) {
      const lines = result.data.split("\n");
      expect(lines).toHaveLength(3); // header + 2 data rows
      expect(lines[1]).toContain("Rex");
      expect(lines[1]).toContain("Hond");
      expect(lines[1]).toContain("Labrador");
      expect(lines[2]).toContain("Mimi");
      expect(lines[2]).toContain("Kat");
    }
  });

  it("passes filters to the query without pagination", async () => {
    await exportAnimalReportCsv({ species: "hond", status: "beschikbaar" });

    expect(mockGetAnimalReport).toHaveBeenCalledWith({
      species: "hond",
      status: "beschikbaar",
    });
  });

  it("escapes commas and quotes in CSV fields", async () => {
    mockGetAnimalReport.mockResolvedValue({
      animals: [{
        ...mockAnimals[0],
        breed: 'Labrador, "Golden"',
      }],
      total: 1,
    });

    const result = await exportAnimalReportCsv({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('"Labrador, ""Golden"""');
    }
  });

  it("allows coordinator role to export", async () => {
    mockGetSession.mockResolvedValue({ userId: 2, role: "coördinator", email: "c@test.com", name: "C" });

    const result = await exportAnimalReportCsv({});

    expect(result.success).toBe(true);
  });

  it("handles empty result set", async () => {
    mockGetAnimalReport.mockResolvedValue({ animals: [], total: 0 });

    const result = await exportAnimalReportCsv({});

    expect(result.success).toBe(true);
    if (result.success) {
      const lines = result.data.split("\n");
      expect(lines).toHaveLength(1); // header only
    }
  });
});
