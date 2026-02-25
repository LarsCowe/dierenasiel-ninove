import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  has: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock database
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({ from: mockFrom }),
    update: () => ({ set: mockSet }),
  },
}));

mockFrom.mockReturnValue({ where: mockWhere });
mockWhere.mockReturnValue({ limit: mockLimit });
mockSet.mockReturnValue({ where: mockUpdateWhere });
mockUpdateWhere.mockResolvedValue(undefined);

// Mock password verification
const mockVerifyPassword = vi.fn();
vi.mock("@/lib/auth/password", () => ({
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
}));

import { loginWithCredentials, logout } from "./auth";

const mockUser = {
  id: 1,
  email: "sven@dierenasielninove.be",
  passwordHash: "$2a$10$hashedpassword",
  name: "Sven",
  role: "beheerder",
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockLimit.mockResolvedValue([mockUser]);
  mockVerifyPassword.mockResolvedValue(true);
});

describe("loginWithCredentials", () => {
  it("returns error for invalid email format without querying DB", async () => {
    const result = await loginWithCredentials("not-an-email", "admin-only");
    expect(result).toHaveProperty("error");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns error for short password without querying DB", async () => {
    const result = await loginWithCredentials("sven@test.be", "short");
    expect(result).toHaveProperty("error");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns role on successful login", async () => {
    const result = await loginWithCredentials(
      "sven@dierenasielninove.be",
      "admin-only"
    );
    expect(result).toHaveProperty("role", "beheerder");
  });

  it("returns error for unknown email", async () => {
    mockLimit.mockResolvedValueOnce([]);

    const result = await loginWithCredentials(
      "nobody@test.be",
      "somepassword"
    );
    expect(result).toHaveProperty("error");
    expect(result.error).toContain("Ongeldig");
  });

  it("returns error for wrong password", async () => {
    mockVerifyPassword.mockResolvedValueOnce(false);

    const result = await loginWithCredentials(
      "sven@dierenasielninove.be",
      "wrongpass"
    );
    expect(result).toHaveProperty("error");
    expect(result.error).toContain("Ongeldig");
  });

  it("returns error for inactive account", async () => {
    mockLimit.mockResolvedValueOnce([{ ...mockUser, isActive: false }]);

    const result = await loginWithCredentials(
      "sven@dierenasielninove.be",
      "admin-only"
    );
    expect(result).toHaveProperty("error");
    expect(result.error).toContain("niet actief");
  });

  it("updates lastLoginAt on successful login", async () => {
    await loginWithCredentials("sven@dierenasielninove.be", "admin-only");
    expect(mockSet).toHaveBeenCalled();
  });
});

describe("logout", () => {
  it("clears session and guest-mode cookies", async () => {
    await logout();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("session");
    expect(mockCookieStore.delete).toHaveBeenCalledWith("guest-mode");
  });
});
