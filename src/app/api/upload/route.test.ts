import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetSession,
  mockPut,
  mockInsertValues,
  mockInsertReturning,
  mockInsert,
  mockLogAudit,
} = vi.hoisted(() => {
  const mockGetSession = vi.fn();
  const mockPut = vi.fn();
  const mockInsertReturning = vi.fn();
  const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
  const mockLogAudit = vi.fn();
  return {
    mockGetSession,
    mockPut,
    mockInsertValues,
    mockInsertReturning,
    mockInsert,
    mockLogAudit,
  };
});

vi.mock("@/lib/auth/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("@vercel/blob", () => ({
  put: mockPut,
}));

vi.mock("@/lib/db", () => ({
  db: { insert: mockInsert },
}));

vi.mock("@/lib/db/schema", () => ({
  animalAttachments: Symbol("animalAttachments"),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

import { POST } from "./route";

function makeRequest(body: FormData): Request {
  return new Request("http://localhost/api/upload", {
    method: "POST",
    body,
  });
}

function makeFile(
  name: string,
  type: string,
  sizeBytes: number = 1024,
): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type });
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      userId: 1,
      email: "admin@test.be",
      role: "beheerder",
      name: "Admin",
    });
    mockPut.mockResolvedValue({
      url: "https://blob.vercel-storage.com/animals/1/photo.jpg",
    });
    mockInsertReturning.mockResolvedValue([
      {
        id: 1,
        animalId: 1,
        fileUrl: "https://blob.vercel-storage.com/animals/1/photo.jpg",
        fileName: "photo.jpg",
        fileType: "image/jpeg",
        context: "dossier",
        description: null,
        uploadedAt: new Date(),
      },
    ]);
    mockLogAudit.mockResolvedValue(undefined);
  });

  it("returns 401 without session", async () => {
    mockGetSession.mockResolvedValue(null);

    const formData = new FormData();
    formData.append("file", makeFile("photo.jpg", "image/jpeg"));
    formData.append("animalId", "1");

    const response = await POST(makeRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Niet ingelogd");
  });

  it("returns 400 when file is missing", async () => {
    const formData = new FormData();
    formData.append("animalId", "1");

    const response = await POST(makeRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("verplicht");
  });

  it("returns 400 when animalId is missing", async () => {
    const formData = new FormData();
    formData.append("file", makeFile("photo.jpg", "image/jpeg"));

    const response = await POST(makeRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("verplicht");
  });

  it("returns 400 for disallowed file type", async () => {
    const formData = new FormData();
    formData.append("file", makeFile("malware.exe", "application/exe"));
    formData.append("animalId", "1");

    const response = await POST(makeRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("bestandstype");
  });

  it("returns 400 for file exceeding 50MB", async () => {
    const largeSize = 51 * 1024 * 1024; // 51MB
    const formData = new FormData();
    formData.append("file", makeFile("huge.jpg", "image/jpeg", largeSize));
    formData.append("animalId", "1");

    const response = await POST(makeRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("50MB");
  });

  it("uploads to Vercel Blob and creates DB record", async () => {
    const formData = new FormData();
    formData.append("file", makeFile("photo.jpg", "image/jpeg"));
    formData.append("animalId", "1");

    const response = await POST(makeRequest(formData));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.fileUrl).toContain("blob.vercel-storage.com");

    // Verify Vercel Blob was called
    expect(mockPut).toHaveBeenCalledWith(
      expect.stringMatching(/^animals\/1\/\d+-photo\.jpg$/),
      expect.any(File),
      { access: "public" },
    );

    // Verify DB insert was called
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        animalId: 1,
        fileUrl: "https://blob.vercel-storage.com/animals/1/photo.jpg",
        fileName: "photo.jpg",
        fileType: "image/jpeg",
      }),
    );
  });

  it("logs audit after successful upload", async () => {
    const formData = new FormData();
    formData.append("file", makeFile("photo.jpg", "image/jpeg"));
    formData.append("animalId", "1");

    await POST(makeRequest(formData));

    expect(mockLogAudit).toHaveBeenCalledWith(
      "upload_attachment",
      "animal_attachment",
      1,
      null,
      expect.objectContaining({ id: 1, animalId: 1 }),
    );
  });

  it("accepts video/mp4 uploads", async () => {
    const formData = new FormData();
    formData.append("file", makeFile("video.mp4", "video/mp4"));
    formData.append("animalId", "1");

    const response = await POST(makeRequest(formData));

    expect(response.status).toBe(200);
  });

  it("accepts application/pdf uploads", async () => {
    const formData = new FormData();
    formData.append("file", makeFile("dossier.pdf", "application/pdf"));
    formData.append("animalId", "1");

    const response = await POST(makeRequest(formData));

    expect(response.status).toBe(200);
  });

  it("includes optional description in DB record", async () => {
    const formData = new FormData();
    formData.append("file", makeFile("photo.jpg", "image/jpeg"));
    formData.append("animalId", "1");
    formData.append("description", "Foto na adoptie");

    await POST(makeRequest(formData));

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Foto na adoptie",
      }),
    );
  });
});
