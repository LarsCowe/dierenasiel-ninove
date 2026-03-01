import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetSession,
  mockHasPermission,
  mockGetMailingRecipients,
  mockSendEmail,
  mockLogAudit,
  mockInsert,
  mockValues,
  mockReturning,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockHasPermission: vi.fn(),
  mockGetMailingRecipients: vi.fn(),
  mockSendEmail: vi.fn(),
  mockLogAudit: vi.fn(),
  mockInsert: vi.fn(),
  mockValues: vi.fn(),
  mockReturning: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("@/lib/permissions", () => ({
  hasPermission: mockHasPermission,
}));

vi.mock("@/lib/queries/mailing", () => ({
  getMailingRecipients: mockGetMailingRecipients,
}));

vi.mock("@/lib/email/send", () => ({
  sendEmail: mockSendEmail,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: mockInsert,
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    })),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  mailingSends: { id: "mailingSends.id" },
  mailingSendRecipients: { id: "mailingSendRecipients.id", sendId: "mailingSendRecipients.sendId" },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { generateMailingList, sendMailingAction } from "./mailing";

const validSession = { userId: 1, role: "beheerder", name: "Admin" };

describe("generateMailingList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(validSession);
    mockHasPermission.mockReturnValue(true);
  });

  it("returns error when not logged in", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await generateMailingList({});

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error");
  });

  it("returns error when lacking permission", async () => {
    mockHasPermission.mockReturnValue(false);

    const result = await generateMailingList({});

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error");
  });

  it("returns recipients on success", async () => {
    const mockRecipients = [
      { candidateId: 1, firstName: "Jan", lastName: "Peeters", email: "jan@test.be", animalName: "Rex", contractDate: "2026-01-15" },
    ];
    mockGetMailingRecipients.mockResolvedValue(mockRecipients);

    const result = await generateMailingList({ species: "hond" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockRecipients);
    }
  });

  it("passes filters to query", async () => {
    mockGetMailingRecipients.mockResolvedValue([]);
    const filters = { dateFrom: "2026-01-01", dateTo: "2026-12-31", species: "kat" };

    await generateMailingList(filters);

    expect(mockGetMailingRecipients).toHaveBeenCalledWith(filters);
  });

  it("returns empty array when no recipients found", async () => {
    mockGetMailingRecipients.mockResolvedValue([]);

    const result = await generateMailingList({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });
});

describe("sendMailingAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(validSession);
    mockHasPermission.mockReturnValue(true);
    mockInsert.mockReturnValue({ values: mockValues });
    mockValues.mockReturnValue({ returning: mockReturning });
    mockReturning.mockResolvedValue([{ id: 1 }]);
    mockSendEmail.mockResolvedValue({ success: true });
  });

  it("returns error when not logged in", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await sendMailingAction({
      recipients: [{ candidateId: 1, firstName: "Jan", lastName: "Peeters", email: "jan@test.be", animalName: "Rex", contractDate: "2026-01-15" }],
      subject: "Test",
      templateName: "follow_up_1_week",
    });

    expect(result.success).toBe(false);
  });

  it("returns error when lacking adoption:write permission", async () => {
    mockHasPermission.mockReturnValue(false);

    const result = await sendMailingAction({
      recipients: [{ candidateId: 1, firstName: "Jan", lastName: "Peeters", email: "jan@test.be", animalName: "Rex", contractDate: "2026-01-15" }],
      subject: "Test",
      templateName: "follow_up_1_week",
    });

    expect(result.success).toBe(false);
  });

  it("returns error when no recipients provided", async () => {
    const result = await sendMailingAction({
      recipients: [],
      subject: "Test",
      templateName: "follow_up_1_week",
    });

    expect(result.success).toBe(false);
  });

  it("returns error when subject is empty", async () => {
    const result = await sendMailingAction({
      recipients: [{ candidateId: 1, firstName: "Jan", lastName: "Peeters", email: "jan@test.be", animalName: "Rex", contractDate: "2026-01-15" }],
      subject: "",
      templateName: "follow_up_1_week",
    });

    expect(result.success).toBe(false);
  });

  it("returns error for invalid template name", async () => {
    const result = await sendMailingAction({
      recipients: [{ candidateId: 1, firstName: "Jan", lastName: "Peeters", email: "jan@test.be", animalName: "Rex", contractDate: "2026-01-15" }],
      subject: "Test",
      templateName: "invalid_template" as "follow_up_1_week",
    });

    expect(result.success).toBe(false);
  });

  it("sends emails and creates mailing send record", async () => {
    const recipients = [
      { candidateId: 1, firstName: "Jan", lastName: "Peeters", email: "jan@test.be", animalName: "Rex", contractDate: "2026-01-15" },
      { candidateId: 2, firstName: "Marie", lastName: "Dupont", email: "marie@test.be", animalName: "Bella", contractDate: "2026-02-01" },
    ];

    const result = await sendMailingAction({
      recipients,
      subject: "Opvolging",
      templateName: "follow_up_1_week",
    });

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockLogAudit).toHaveBeenCalled();
  });

  it("handles partial email failures gracefully", async () => {
    mockSendEmail
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: "Resend error" });

    const recipients = [
      { candidateId: 1, firstName: "Jan", lastName: "Peeters", email: "jan@test.be", animalName: "Rex", contractDate: "2026-01-15" },
      { candidateId: 2, firstName: "Marie", lastName: "Dupont", email: "marie@test.be", animalName: "Bella", contractDate: "2026-02-01" },
    ];

    const result = await sendMailingAction({
      recipients,
      subject: "Opvolging",
      templateName: "follow_up_1_week",
    });

    // Should still succeed overall (partial failures are logged per-recipient)
    expect(result.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
  });

  it("logs audit trail on success", async () => {
    const recipients = [
      { candidateId: 1, firstName: "Jan", lastName: "Peeters", email: "jan@test.be", animalName: "Rex", contractDate: "2026-01-15" },
    ];

    await sendMailingAction({
      recipients,
      subject: "Opvolging",
      templateName: "follow_up_1_week",
    });

    expect(mockLogAudit).toHaveBeenCalledWith(
      "mailing.sent",
      "mailing_send",
      1,
      null,
      expect.objectContaining({ recipientCount: 1, templateName: "follow_up_1_week" }),
    );
  });
});
