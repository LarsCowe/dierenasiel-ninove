import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mocks — these are available inside vi.mock factories
const { mockValues, mockInsert } = vi.hoisted(() => {
  const mockValues = vi.fn().mockResolvedValue(undefined);
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
  return { mockValues, mockInsert };
});

// Mock db
vi.mock("@/lib/db", () => ({
  db: { insert: mockInsert },
}));

// Mock schema (just needs the auditLogs export)
vi.mock("@/lib/db/schema", () => ({
  auditLogs: Symbol("auditLogs"),
}));

// Mock session
vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

import { logAudit } from "./index";
import { getSession } from "@/lib/auth/session";
import { headers } from "next/headers";

const mockGetSession = vi.mocked(getSession);
const mockHeaders = vi.mocked(headers);

describe("logAudit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      userId: 1,
      email: "admin@example.com",
      role: "beheerder",
      name: "Admin",
    });
    mockHeaders.mockResolvedValue(
      new Headers({ "x-forwarded-for": "192.168.1.1" }) as never,
    );
  });

  it("logs an insert scenario with old_value=null and new_value=data", async () => {
    const newData = { name: "Rex", species: "hond" };

    await logAudit("animal.created", "animal", 42, null, newData);

    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith({
      userId: 1,
      action: "animal.created",
      entityType: "animal",
      entityId: 42,
      oldValue: null,
      newValue: newData,
      ipAddress: "192.168.1.1",
    });
  });

  it("logs an update scenario with old_value and new_value", async () => {
    const oldData = { name: "Rex" };
    const newData = { name: "Rex II" };

    await logAudit("animal.updated", "animal", 42, oldData, newData);

    expect(mockValues).toHaveBeenCalledWith({
      userId: 1,
      action: "animal.updated",
      entityType: "animal",
      entityId: 42,
      oldValue: oldData,
      newValue: newData,
      ipAddress: "192.168.1.1",
    });
  });

  it("logs a delete scenario with old_value=data and new_value=null", async () => {
    const oldData = { name: "Rex", species: "hond" };

    await logAudit("animal.deleted", "animal", 42, oldData, null);

    expect(mockValues).toHaveBeenCalledWith({
      userId: 1,
      action: "animal.deleted",
      entityType: "animal",
      entityId: 42,
      oldValue: oldData,
      newValue: null,
      ipAddress: "192.168.1.1",
    });
  });

  it("gets userId automatically from session", async () => {
    mockGetSession.mockResolvedValue({
      userId: 7,
      email: "user@example.com",
      role: "medewerker",
      name: "User",
    });

    await logAudit("animal.created", "animal", 1, null, {});

    expect(mockGetSession).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 7 }),
    );
  });

  it("gets ip_address from x-forwarded-for header", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "x-forwarded-for": "10.0.0.1, 10.0.0.2" }) as never,
    );

    await logAudit("animal.created", "animal", 1, null, {});

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ ipAddress: "10.0.0.1" }),
    );
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "x-real-ip": "172.16.0.1" }) as never,
    );

    await logAudit("animal.created", "animal", 1, null, {});

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ ipAddress: "172.16.0.1" }),
    );
  });

  it("works without session (system actions) — userId=null", async () => {
    mockGetSession.mockResolvedValue(null);

    await logAudit("system.cleanup", "animal", 99, { old: true }, null);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null }),
    );
  });

  it("sets ipAddress to null when no IP headers present", async () => {
    mockHeaders.mockResolvedValue(new Headers() as never);

    await logAudit("animal.created", "animal", 1, null, {});

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ ipAddress: null }),
    );
  });
});
