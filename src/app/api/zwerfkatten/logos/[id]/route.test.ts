import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetSession,
  mockHasPermission,
  mockPut,
  mockDel,
  mockUpdateWhere,
  mockUpdateSet,
  mockUpdate,
  mockDeleteWhere,
  mockDelete,
  mockLogAudit,
  mockGetById,
  mockGetByName,
} = vi.hoisted(() => {
  const mockUpdateWhere = vi.fn();
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
  const mockDeleteWhere = vi.fn();
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });
  return {
    mockGetSession: vi.fn(),
    mockHasPermission: vi.fn(),
    mockPut: vi.fn(),
    mockDel: vi.fn(),
    mockUpdateWhere,
    mockUpdateSet,
    mockUpdate,
    mockDeleteWhere,
    mockDelete,
    mockLogAudit: vi.fn(),
    mockGetById: vi.fn(),
    mockGetByName: vi.fn(),
  };
});

vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/permissions", () => ({ hasPermission: mockHasPermission }));
vi.mock("@vercel/blob", () => ({ put: mockPut, del: mockDel }));
vi.mock("@/lib/db", () => ({ db: { update: mockUpdate, delete: mockDelete } }));
vi.mock("@/lib/db/schema", () => ({
  municipalityLogos: { id: Symbol("municipalityLogos.id") },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("@/lib/queries/municipality-logos", () => ({
  getMunicipalityLogoById: mockGetById,
  getMunicipalityLogoByName: mockGetByName,
}));

import { PATCH, DELETE } from "./route";

const existingLogo = {
  id: 7,
  name: "Ninove",
  logoUrl: "https://blob.com/old.png",
  uploadedBy: "sven@asiel.be",
  uploadedAt: new Date(),
};

function paramsFor(id: number) {
  return { params: Promise.resolve({ id: String(id) }) };
}

describe("PATCH /api/zwerfkatten/logos/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 1, email: "sven@asiel.be", role: "beheerder" });
    mockHasPermission.mockReturnValue(true);
    mockGetById.mockResolvedValue(existingLogo);
    mockGetByName.mockResolvedValue(null);
    mockPut.mockResolvedValue({ url: "https://blob.com/new.png" });
    mockUpdateWhere.mockResolvedValue({});
  });

  function makeReq(body: Record<string, string | File | null>) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(body)) {
      if (v !== null) fd.append(k, v as string | File);
    }
    return new Request("http://localhost/api/zwerfkatten/logos/7", { method: "PATCH", body: fd });
  }

  it("updates name without replacing image", async () => {
    const res = await PATCH(makeReq({ name: "Ninove (nieuw)" }), paramsFor(7));
    expect(res.status).toBe(200);
    expect(mockPut).not.toHaveBeenCalled();
    expect(mockDel).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("updates name + replaces image (deletes old blob)", async () => {
    const file = new File([new ArrayBuffer(1024)], "new.png", { type: "image/png" });
    const res = await PATCH(makeReq({ name: "Ninove", file }), paramsFor(7));
    expect(res.status).toBe(200);
    expect(mockPut).toHaveBeenCalled();
    expect(mockDel).toHaveBeenCalledWith("https://blob.com/old.png");
  });

  it("rejects when name conflicts with another logo", async () => {
    mockGetByName.mockResolvedValue({ id: 99, name: "Aalst" });
    const res = await PATCH(makeReq({ name: "Aalst" }), paramsFor(7));
    expect(res.status).toBe(400);
  });

  it("allows keeping the same name (own row)", async () => {
    mockGetByName.mockResolvedValue(existingLogo);
    const res = await PATCH(makeReq({ name: "Ninove" }), paramsFor(7));
    expect(res.status).toBe(200);
  });

  it("returns 404 when logo not found", async () => {
    mockGetById.mockResolvedValue(null);
    const res = await PATCH(makeReq({ name: "X" }), paramsFor(999));
    expect(res.status).toBe(404);
  });

  it("rejects unauthenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await PATCH(makeReq({ name: "X" }), paramsFor(7));
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/zwerfkatten/logos/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 1, email: "sven@asiel.be", role: "beheerder" });
    mockHasPermission.mockReturnValue(true);
    mockGetById.mockResolvedValue(existingLogo);
    mockDeleteWhere.mockResolvedValue({});
  });

  it("deletes blob + db row + audit", async () => {
    const req = new Request("http://localhost/api/zwerfkatten/logos/7", { method: "DELETE" });
    const res = await DELETE(req, paramsFor(7));
    expect(res.status).toBe(200);
    expect(mockDel).toHaveBeenCalledWith("https://blob.com/old.png");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockLogAudit).toHaveBeenCalledWith(
      "municipality_logo.deleted",
      "municipality_logo",
      7,
      expect.any(Object),
      null,
    );
  });

  it("returns 404 when not found", async () => {
    mockGetById.mockResolvedValue(null);
    const req = new Request("http://localhost/api/zwerfkatten/logos/999", { method: "DELETE" });
    const res = await DELETE(req, paramsFor(999));
    expect(res.status).toBe(404);
  });

  it("rejects without permission", async () => {
    mockHasPermission.mockReturnValue(false);
    const req = new Request("http://localhost/api/zwerfkatten/logos/7", { method: "DELETE" });
    const res = await DELETE(req, paramsFor(7));
    expect(res.status).toBe(403);
  });
});
