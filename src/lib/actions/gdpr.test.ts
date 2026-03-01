import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetSession,
  mockHasPermission,
  mockLogAudit,
  mockRevalidatePath,
  mockAnonymizeAdoptionCandidate,
  mockAnonymizeWalker,
} = vi.hoisted(() => {
  return {
    mockGetSession: vi.fn(),
    mockHasPermission: vi.fn(),
    mockLogAudit: vi.fn(),
    mockRevalidatePath: vi.fn(),
    mockAnonymizeAdoptionCandidate: vi.fn(),
    mockAnonymizeWalker: vi.fn(),
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

import { anonymizeCandidateAction, anonymizeWalkerAction } from "./gdpr";

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
