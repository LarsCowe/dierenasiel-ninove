import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetSession,
  mockHasPermission,
  mockPut,
  mockInsertReturning,
  mockInsertValues,
  mockInsert,
  mockUpdateWhere,
  mockUpdateSet,
  mockUpdate,
  mockLogAudit,
  mockGetByName,
} = vi.hoisted(() => {
  const mockInsertReturning = vi.fn();
  const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
  const mockUpdateWhere = vi.fn();
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
  return {
    mockGetSession: vi.fn(),
    mockHasPermission: vi.fn(),
    mockPut: vi.fn(),
    mockInsertReturning,
    mockInsertValues,
    mockInsert,
    mockUpdateWhere,
    mockUpdateSet,
    mockUpdate,
    mockLogAudit: vi.fn(),
    mockGetByName: vi.fn(),
  };
});

vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/permissions", () => ({ hasPermission: mockHasPermission }));
vi.mock("@vercel/blob", () => ({ put: mockPut }));
vi.mock("@/lib/db", () => ({ db: { insert: mockInsert, update: mockUpdate } }));
vi.mock("@/lib/db/schema", () => ({
  municipalityLogos: { id: Symbol("municipalityLogos.id") },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("@/lib/queries/municipality-logos", () => ({
  getMunicipalityLogoByName: mockGetByName,
}));

import { POST } from "./route";

function file(name = "ninove.png", type = "image/png", size = 1024) {
  return new File([new ArrayBuffer(size)], name, { type });
}

function req(file: File | null, name: string | null) {
  const fd = new FormData();
  if (file) fd.append("file", file);
  if (name !== null) fd.append("name", name);
  return new Request("http://localhost/api/zwerfkatten/logos", { method: "POST", body: fd });
}

describe("POST /api/zwerfkatten/logos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 1, email: "sven@asiel.be", role: "beheerder" });
    mockHasPermission.mockReturnValue(true);
    mockGetByName.mockResolvedValue(null);
    mockInsertReturning.mockResolvedValue([{ id: 42 }]);
    mockPut.mockResolvedValue({ url: "https://blob.com/ninove.png" });
  });

  it("uploads logo successfully", async () => {
    const res = await POST(req(file(), "Ninove"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(42);
    expect(mockPut).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
    expect(mockLogAudit).toHaveBeenCalledWith(
      "municipality_logo.created",
      "municipality_logo",
      42,
      null,
      expect.objectContaining({ name: "Ninove" }),
    );
  });

  it("rejects duplicate name (active)", async () => {
    mockGetByName.mockResolvedValue({ id: 5, name: "Ninove", deletedAt: null });
    const res = await POST(req(file(), "Ninove"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("bestaat al");
  });

  it("reactivates soft-deleted opdrachtgever with same name", async () => {
    mockGetByName.mockResolvedValue({
      id: 5,
      name: "Ninove",
      logoUrl: "https://blob.com/old.png",
      deletedAt: new Date(),
    });
    mockUpdateWhere.mockResolvedValue({});
    const res = await POST(req(file(), "Ninove"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(5);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    const setArg = mockUpdateSet.mock.calls[0]?.[0];
    expect(setArg).toHaveProperty("deletedAt", null);
    expect(mockLogAudit).toHaveBeenCalledWith(
      "municipality_logo.reactivated",
      "municipality_logo",
      5,
      expect.any(Object),
      expect.any(Object),
    );
  });

  it("accepts svg", async () => {
    const res = await POST(req(file("ninove.svg", "image/svg+xml"), "Ninove"));
    expect(res.status).toBe(200);
  });

  it("rejects non-image file", async () => {
    const res = await POST(req(file("doc.pdf", "application/pdf"), "Ninove"));
    expect(res.status).toBe(400);
  });

  it("rejects file > 2MB", async () => {
    const res = await POST(req(file("big.png", "image/png", 3 * 1024 * 1024), "Ninove"));
    expect(res.status).toBe(400);
  });

  it("rejects missing name", async () => {
    const res = await POST(req(file(), ""));
    expect(res.status).toBe(400);
  });

  it("rejects missing file", async () => {
    const res = await POST(req(null, "Ninove"));
    expect(res.status).toBe(400);
  });

  it("rejects unauthenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await POST(req(file(), "Ninove"));
    expect(res.status).toBe(401);
  });

  it("rejects without permission", async () => {
    mockHasPermission.mockReturnValue(false);
    const res = await POST(req(file(), "Ninove"));
    expect(res.status).toBe(403);
  });
});
