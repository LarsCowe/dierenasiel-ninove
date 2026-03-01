import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

vi.mock("./index", () => ({
  resend: {
    emails: {
      send: mockSend,
    },
  },
}));

import { sendEmail } from "./send";

describe("sendEmail", () => {
  const params = {
    to: "test@example.com",
    from: "honden@dierenasielninove.be",
    subject: "Test Subject",
    html: "<p>Test</p>",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_key";
  });

  it("returns error when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendEmail(params);

    expect(result.success).toBe(false);
    expect(result.error).toContain("RESEND_API_KEY");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sends email via Resend and returns success", async () => {
    mockSend.mockResolvedValue({ id: "msg_123" });

    const result = await sendEmail(params);

    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledWith({
      to: params.to,
      from: params.from,
      subject: params.subject,
      html: params.html,
    });
  });

  it("returns error when Resend API fails", async () => {
    mockSend.mockRejectedValue(new Error("Resend API error"));

    const result = await sendEmail(params);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Resend API error");
  });
});
