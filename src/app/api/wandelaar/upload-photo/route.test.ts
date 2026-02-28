import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPut } = vi.hoisted(() => {
  const mockPut = vi.fn();
  return { mockPut };
});

vi.mock("@vercel/blob", () => ({
  put: mockPut,
}));

import { POST } from "./route";

function makeRequest(file: File): Request {
  const formData = new FormData();
  formData.append("file", file);
  return new Request("http://localhost/api/wandelaar/upload-photo", {
    method: "POST",
    body: formData,
  });
}

function makeFile(name: string, type: string, sizeKB: number): File {
  const buffer = new ArrayBuffer(sizeKB * 1024);
  return new File([buffer], name, { type });
}

describe("POST /api/wandelaar/upload-photo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPut.mockResolvedValue({ url: "https://blob.vercel.com/walkers/photos/123-photo.jpg" });
  });

  it("returns error when no file is provided", async () => {
    const formData = new FormData();
    const request = new Request("http://localhost/api/wandelaar/upload-photo", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("rejects non-image file types", async () => {
    const file = makeFile("doc.pdf", "application/pdf", 100);
    const response = await POST(makeRequest(file));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("afbeelding");
  });

  it("rejects files larger than 5MB", async () => {
    const file = makeFile("big.jpg", "image/jpeg", 5 * 1024 + 1);
    const response = await POST(makeRequest(file));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("5MB");
  });

  it("accepts valid JPEG upload", async () => {
    const file = makeFile("photo.jpg", "image/jpeg", 500);
    const response = await POST(makeRequest(file));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.url).toBe("https://blob.vercel.com/walkers/photos/123-photo.jpg");
  });

  it("accepts valid PNG upload", async () => {
    const file = makeFile("photo.png", "image/png", 500);
    const response = await POST(makeRequest(file));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("accepts valid WebP upload", async () => {
    const file = makeFile("photo.webp", "image/webp", 500);
    const response = await POST(makeRequest(file));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("uploads to correct blob path with sanitized name", async () => {
    const file = makeFile("my photo (1).jpg", "image/jpeg", 100);
    await POST(makeRequest(file));

    expect(mockPut).toHaveBeenCalledWith(
      expect.stringMatching(/^walkers\/photos\/\d+-my_photo_1_.jpg$/),
      file,
      { access: "public" },
    );
  });

  it("returns 500 when blob upload fails", async () => {
    mockPut.mockRejectedValue(new Error("Blob error"));
    const file = makeFile("photo.jpg", "image/jpeg", 100);
    const response = await POST(makeRequest(file));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});
