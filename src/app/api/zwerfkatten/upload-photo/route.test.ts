import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetSession,
  mockHasPermission,
  mockPut,
  mockDel,
  mockUpdateWhere,
  mockUpdateSet,
  mockUpdate,
  mockLogAudit,
  mockGetCampaignById,
} = vi.hoisted(() => {
  const mockGetSession = vi.fn();
  const mockHasPermission = vi.fn();
  const mockPut = vi.fn();
  const mockDel = vi.fn();
  const mockUpdateWhere = vi.fn();
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
  const mockLogAudit = vi.fn();
  const mockGetCampaignById = vi.fn();
  return {
    mockGetSession,
    mockHasPermission,
    mockPut,
    mockDel,
    mockUpdateWhere,
    mockUpdateSet,
    mockUpdate,
    mockLogAudit,
    mockGetCampaignById,
  };
});

vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/permissions", () => ({ hasPermission: mockHasPermission }));
vi.mock("@vercel/blob", () => ({ put: mockPut, del: mockDel }));
vi.mock("@/lib/db", () => ({ db: { update: mockUpdate } }));
vi.mock("@/lib/db/schema", () => ({
  strayCatCampaigns: { id: Symbol("strayCatCampaigns.id") },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("@/lib/queries/stray-cat-campaigns", () => ({ getCampaignById: mockGetCampaignById }));

import { POST } from "./route";

function createMockFile(name = "kat.jpg", type = "image/jpeg", size = 1024) {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

function createRequest(file: File | null, campaignId: string | number) {
  const formData = new FormData();
  if (file) formData.append("file", file);
  formData.append("campaignId", String(campaignId));
  return new Request("http://localhost/api/zwerfkatten/upload-photo", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/zwerfkatten/upload-photo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 1, role: "beheerder" });
    mockHasPermission.mockReturnValue(true);
    mockGetCampaignById.mockResolvedValue({ id: 1, photoUrl: null, status: "open" });
  });

  it("uploads a photo successfully", async () => {
    mockPut.mockResolvedValue({ url: "https://blob.vercel-storage.com/kat.jpg" });

    const file = createMockFile();
    const res = await POST(createRequest(file, 1));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.photoUrl).toBe("https://blob.vercel-storage.com/kat.jpg");
    expect(mockPut).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockLogAudit).toHaveBeenCalledWith(
      "stray_cat_campaign.photo_uploaded",
      "stray_cat_campaign",
      1,
      null,
      expect.objectContaining({ photoUrl: "https://blob.vercel-storage.com/kat.jpg" }),
    );
  });

  it("rejects non-existent campaign", async () => {
    mockGetCampaignById.mockResolvedValue(null);

    const file = createMockFile();
    const res = await POST(createRequest(file, 999));

    expect(res.status).toBe(404);
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("deletes old blob when replacing photo", async () => {
    mockGetCampaignById.mockResolvedValue({ id: 1, photoUrl: "https://old-blob.com/old.jpg", status: "open" });
    mockPut.mockResolvedValue({ url: "https://blob.vercel-storage.com/new.jpg" });

    const file = createMockFile();
    const res = await POST(createRequest(file, 1));

    expect(res.status).toBe(200);
    expect(mockDel).toHaveBeenCalledWith("https://old-blob.com/old.jpg");
  });

  it("rejects unauthenticated user", async () => {
    mockGetSession.mockResolvedValue(null);

    const file = createMockFile();
    const res = await POST(createRequest(file, 1));

    expect(res.status).toBe(401);
  });

  it("rejects user without permission", async () => {
    mockHasPermission.mockReturnValue(false);

    const file = createMockFile();
    const res = await POST(createRequest(file, 1));

    expect(res.status).toBe(403);
  });

  it("rejects invalid file type", async () => {
    const file = createMockFile("doc.pdf", "application/pdf");
    const res = await POST(createRequest(file, 1));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Ongeldig bestandstype");
  });

  it("rejects missing file", async () => {
    const res = await POST(createRequest(null, 1));

    expect(res.status).toBe(400);
  });

  it("rejects file exceeding size limit", async () => {
    const file = createMockFile("big.jpg", "image/jpeg", 11 * 1024 * 1024);
    const res = await POST(createRequest(file, 1));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("te groot");
  });
});
