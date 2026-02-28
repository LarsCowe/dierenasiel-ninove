import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetSession, mockGetWalkHistory } = vi.hoisted(() => {
  const mockGetSession = vi.fn();
  const mockGetWalkHistory = vi.fn();
  return { mockGetSession, mockGetWalkHistory };
});

vi.mock("@/lib/auth/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("@/lib/queries/walks", () => ({
  getWalkHistoryByWalkerId: mockGetWalkHistory,
  getWalkHistoryByAnimalId: mockGetWalkHistory,
}));

import { exportWalksCsv } from "./walk-export";

const mockHistory = [
  {
    id: 1, date: "2026-03-20", startTime: "10:00", endTime: "11:30",
    durationMinutes: 90, remarks: "Leuke wandeling", status: "completed",
    walkerFirstName: "Jan", walkerLastName: "Janssens", animalName: "Rex",
  },
  {
    id: 2, date: "2026-03-18", startTime: "14:00", endTime: "15:00",
    durationMinutes: 60, remarks: null, status: "completed",
    walkerFirstName: "Els", walkerLastName: "Peeters", animalName: "Buddy",
  },
];

describe("exportWalksCsv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 1, role: "beheerder", email: "admin@test.com", name: "Admin" });
    mockGetWalkHistory.mockResolvedValue(mockHistory);
  });

  it("returns error when not logged in", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await exportWalksCsv({ walkerId: 1 });

    expect(result.success).toBe(false);
  });

  it("returns error when not beheerder role", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "wandelaar", email: "j@test.com", name: "J" });

    const result = await exportWalksCsv({ walkerId: 1 });

    expect(result.success).toBe(false);
  });

  it("generates CSV with correct headers and data for walker", async () => {
    const result = await exportWalksCsv({ walkerId: 1 });

    expect(result.success).toBe(true);
    if (result.success) {
      const lines = result.data.split("\n");
      expect(lines[0]).toBe("Datum,Wandelaar,Hond,Start,Einde,Duur (min),Opmerkingen,Status");
      expect(lines[1]).toContain("2026-03-20");
      expect(lines[1]).toContain("Jan Janssens");
      expect(lines[1]).toContain("Rex");
      expect(lines[1]).toContain("90");
      expect(lines[2]).toContain("Els Peeters");
    }
  });

  it("generates CSV for animal", async () => {
    const result = await exportWalksCsv({ animalId: 5 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain("Datum,Wandelaar,Hond");
    }
  });

  it("escapes commas and quotes in CSV fields", async () => {
    mockGetWalkHistory.mockResolvedValue([{
      ...mockHistory[0],
      remarks: 'Hond was "angstig", trok hard',
    }]);

    const result = await exportWalksCsv({ walkerId: 1 });

    expect(result.success).toBe(true);
    if (result.success) {
      // Double quotes should be escaped and field wrapped in quotes
      expect(result.data).toContain('"Hond was ""angstig"", trok hard"');
    }
  });

  it("returns error when no filter provided", async () => {
    const result = await exportWalksCsv({});

    expect(result.success).toBe(false);
  });
});
