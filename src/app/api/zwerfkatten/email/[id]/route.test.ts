import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetSession,
  mockHasPermission,
  mockDel,
  mockSelectLimit,
  mockSelectWhere,
  mockSelectFrom,
  mockSelect,
  mockDeleteWhere,
  mockDelete,
  mockLogAudit,
} = vi.hoisted(() => {
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });
  const mockDeleteWhere = vi.fn();
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });
  return {
    mockGetSession: vi.fn(),
    mockHasPermission: vi.fn(),
    mockDel: vi.fn(),
    mockSelectLimit,
    mockSelectWhere,
    mockSelectFrom,
    mockSelect,
    mockDeleteWhere,
    mockDelete,
    mockLogAudit: vi.fn(),
  };
});

vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/permissions", () => ({ hasPermission: mockHasPermission }));
vi.mock("@vercel/blob", () => ({ del: mockDel }));
vi.mock("@/lib/db", () => ({
  db: { select: mockSelect, delete: mockDelete },
}));
vi.mock("@/lib/db/schema", () => ({
  strayCatCampaignAttachments: { id: Symbol("strayCatCampaignAttachments.id") },
}));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));

import { DELETE } from "./route";

function createParams(id: string | number) {
  return { params: Promise.resolve({ id: String(id) }) };
}

describe("DELETE /api/zwerfkatten/email/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 1, email: "sven@asiel.be", role: "beheerder" });
    mockHasPermission.mockReturnValue(true);
    mockSelectLimit.mockResolvedValue([
      { id: 99, campaignId: 1, blobUrl: "https://blob.com/mail.eml", fileName: "mail.eml" },
    ]);
    mockDeleteWhere.mockResolvedValue({});
  });

  it("deletes blob + db row + writes audit", async () => {
    const req = new Request("http://localhost/api/zwerfkatten/email/99", { method: "DELETE" });
    const res = await DELETE(req, createParams(99));

    expect(res.status).toBe(200);
    expect(mockDel).toHaveBeenCalledWith("https://blob.com/mail.eml");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockLogAudit).toHaveBeenCalledWith(
      "stray_cat_campaign.email_deleted",
      "stray_cat_campaign",
      1,
      expect.any(Object),
      null,
    );
  });

  it("returns 404 when attachment does not exist", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const req = new Request("http://localhost/api/zwerfkatten/email/999", { method: "DELETE" });
    const res = await DELETE(req, createParams(999));

    expect(res.status).toBe(404);
    expect(mockDel).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated user", async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request("http://localhost/api/zwerfkatten/email/99", { method: "DELETE" });
    const res = await DELETE(req, createParams(99));

    expect(res.status).toBe(401);
  });

  it("rejects user without permission", async () => {
    mockHasPermission.mockReturnValue(false);
    const req = new Request("http://localhost/api/zwerfkatten/email/99", { method: "DELETE" });
    const res = await DELETE(req, createParams(99));

    expect(res.status).toBe(403);
  });
});
