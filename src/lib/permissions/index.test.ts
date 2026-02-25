import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();
vi.mock("@/lib/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

import { hasPermission, requirePermission } from "./index";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("hasPermission", () => {
  it("returns true for beheerder with user:manage", () => {
    expect(hasPermission("beheerder", "user:manage")).toBe(true);
  });

  it("returns false for medewerker with user:manage", () => {
    expect(hasPermission("medewerker", "user:manage")).toBe(false);
  });

  it("returns true for dierenarts with medical:write", () => {
    expect(hasPermission("dierenarts", "medical:write")).toBe(true);
  });

  it("returns false for unknown role", () => {
    expect(hasPermission("wandelaar", "animal:read")).toBe(false);
  });

  it("returns false for unknown permission", () => {
    expect(hasPermission("beheerder", "nonexistent:action" as any)).toBe(
      false
    );
  });
});

describe("requirePermission", () => {
  it("returns undefined when user has permission", async () => {
    mockGetSession.mockResolvedValue({
      userId: 1,
      email: "sven@test.be",
      role: "beheerder",
      name: "Sven",
    });

    const result = await requirePermission("user:manage");
    expect(result).toBeUndefined();
  });

  it("returns ActionResult error when user lacks permission", async () => {
    mockGetSession.mockResolvedValue({
      userId: 2,
      email: "jan@test.be",
      role: "medewerker",
      name: "Jan",
    });

    const result = await requirePermission("user:manage");
    expect(result).toBeDefined();
    expect(result!.success).toBe(false);
    if (!result!.success) {
      expect(result!.error).toBe("Onvoldoende rechten");
    }
  });

  it("returns error without active session", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await requirePermission("animal:read");
    expect(result).toBeDefined();
    expect(result!.success).toBe(false);
    if (!result!.success) {
      expect(result!.error).toBe("Niet ingelogd");
    }
  });

  it("allows dierenarts to perform medical:write", async () => {
    mockGetSession.mockResolvedValue({
      userId: 3,
      email: "dr.peeters@test.be",
      role: "dierenarts",
      name: "Dr. Peeters",
    });

    const result = await requirePermission("medical:write");
    expect(result).toBeUndefined();
  });

  it("blocks medewerker from user:manage with correct error message", async () => {
    mockGetSession.mockResolvedValue({
      userId: 2,
      email: "jan@test.be",
      role: "medewerker",
      name: "Jan",
    });

    const result = await requirePermission("user:manage");
    expect(result).toEqual({
      success: false,
      error: "Onvoldoende rechten",
    });
  });
});
