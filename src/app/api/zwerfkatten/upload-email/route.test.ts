import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetSession,
  mockHasPermission,
  mockPut,
  mockInsertValues,
  mockInsertReturning,
  mockInsert,
  mockLogAudit,
  mockGetCampaignById,
} = vi.hoisted(() => {
  const mockInsertReturning = vi.fn();
  const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
  return {
    mockGetSession: vi.fn(),
    mockHasPermission: vi.fn(),
    mockPut: vi.fn(),
    mockInsertValues,
    mockInsertReturning,
    mockInsert,
    mockLogAudit: vi.fn(),
    mockGetCampaignById: vi.fn(),
  };
});

vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/permissions", () => ({ hasPermission: mockHasPermission }));
vi.mock("@vercel/blob", () => ({ put: mockPut }));
vi.mock("@/lib/db", () => ({ db: { insert: mockInsert } }));
vi.mock("@/lib/db/schema", () => ({
  strayCatCampaignAttachments: { id: Symbol("strayCatCampaignAttachments.id") },
}));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("@/lib/queries/stray-cat-campaigns", () => ({ getCampaignById: mockGetCampaignById }));

import { POST } from "./route";

function createMockFile(name = "mail.eml", type = "message/rfc822", size = 1024) {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

function createRequest(file: File | null, campaignId: string | number) {
  const formData = new FormData();
  if (file) formData.append("file", file);
  formData.append("campaignId", String(campaignId));
  return new Request("http://localhost/api/zwerfkatten/upload-email", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/zwerfkatten/upload-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ userId: 1, email: "sven@asiel.be", role: "beheerder" });
    mockHasPermission.mockReturnValue(true);
    mockGetCampaignById.mockResolvedValue({ id: 1, status: "open" });
    mockInsertReturning.mockResolvedValue([{ id: 99 }]);
    mockPut.mockResolvedValue({ url: "https://blob.vercel-storage.com/mail.eml" });
  });

  it("uploads .eml successfully and returns attachment row", async () => {
    const file = createMockFile();
    const res = await POST(createRequest(file, 1));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(99);
    expect(body.data.blobUrl).toBe("https://blob.vercel-storage.com/mail.eml");
    expect(mockPut).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalled();
    expect(mockLogAudit).toHaveBeenCalledWith(
      "stray_cat_campaign.email_uploaded",
      "stray_cat_campaign",
      1,
      null,
      expect.objectContaining({ attachmentId: 99, fileName: "mail.eml" }),
    );
  });

  it("accepts .eml even when mimeType is application/octet-stream (Outlook export)", async () => {
    const file = createMockFile("brief.eml", "application/octet-stream");
    const res = await POST(createRequest(file, 1));

    expect(res.status).toBe(200);
  });

  it("rejects non-.eml file", async () => {
    const file = createMockFile("doc.pdf", "application/pdf");
    const res = await POST(createRequest(file, 1));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain(".eml");
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("rejects file exceeding 10MB", async () => {
    const file = createMockFile("big.eml", "message/rfc822", 11 * 1024 * 1024);
    const res = await POST(createRequest(file, 1));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("te groot");
  });

  it("rejects missing file", async () => {
    const res = await POST(createRequest(null, 1));
    expect(res.status).toBe(400);
  });

  it("rejects non-existent campaign", async () => {
    mockGetCampaignById.mockResolvedValue(null);
    const file = createMockFile();
    const res = await POST(createRequest(file, 999));

    expect(res.status).toBe(404);
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated user", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await POST(createRequest(createMockFile(), 1));
    expect(res.status).toBe(401);
  });

  it("rejects user without permission", async () => {
    mockHasPermission.mockReturnValue(false);
    const res = await POST(createRequest(createMockFile(), 1));
    expect(res.status).toBe(403);
  });
});
