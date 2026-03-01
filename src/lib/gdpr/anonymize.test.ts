import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockDel,
  mockSelectLimit,
  mockSelectWhere,
  mockSelectFrom,
  mockUpdateReturning,
  mockUpdateWhere,
  mockUpdateSet,
  mockUpdate,
} = vi.hoisted(() => {
  const mockDel = vi.fn();

  // select chain: db.select().from().where().limit()
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });

  // update chain: db.update().set().where().returning()
  const mockUpdateReturning = vi.fn();
  const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning });
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

  return {
    mockDel,
    mockSelectLimit,
    mockSelectWhere,
    mockSelectFrom,
    mockUpdateReturning,
    mockUpdateWhere,
    mockUpdateSet,
    mockUpdate,
  };
});

vi.mock("@vercel/blob", () => ({
  del: mockDel,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
    update: mockUpdate,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  adoptionCandidates: Symbol("adoptionCandidates"),
  walkers: Symbol("walkers"),
  users: Symbol("users"),
  mailingSendRecipients: Symbol("mailingSendRecipients"),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));

import { anonymizeAdoptionCandidate, anonymizeWalker } from "./anonymize";

const mockCandidate = {
  id: 1,
  firstName: "Jan",
  lastName: "Janssens",
  email: "jan@example.com",
  phone: "0471234567",
  address: "Kerkstraat 1, 9400 Ninove",
  animalId: 10,
  questionnaireAnswers: { woonsituatie: "huis_met_tuin" },
  category: "goede_kandidaat",
  categorySetBy: "admin",
  status: "adopted",
  notes: "Goed gesprek gehad",
  anonymisedAt: null,
  createdAt: new Date("2025-06-01"),
};

const mockWalker = {
  id: 5,
  firstName: "Marie",
  lastName: "Peeters",
  dateOfBirth: "1990-05-15",
  address: "Brusselsesteenweg 10, 9400 Ninove",
  phone: "0498765432",
  email: "marie@example.com",
  allergies: "Pollen",
  childrenWalkAlong: true,
  regulationsRead: true,
  barcode: "WLK-5",
  photoUrl: "https://blob.vercel-storage.com/walkers/photos/1234-marie.jpg",
  isApproved: true,
  walkCount: 12,
  isWalkingClubMember: false,
  status: "approved",
  rejectionReason: null,
  userId: 99,
  anonymisedAt: null,
  createdAt: new Date("2025-08-01"),
};

describe("anonymizeAdoptionCandidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockCandidate]);
    mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning });
    mockUpdateReturning.mockResolvedValue([{ ...mockCandidate, firstName: "[verwijderd]" }]);
  });

  it("returns null when candidate not found", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await anonymizeAdoptionCandidate(999);

    expect(result).toBeNull();
  });

  it("returns null when candidate already anonymised", async () => {
    mockSelectLimit.mockResolvedValue([{ ...mockCandidate, anonymisedAt: new Date() }]);

    const result = await anonymizeAdoptionCandidate(1);

    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates PII fields to [verwijderd]", async () => {
    await anonymizeAdoptionCandidate(1);

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "[verwijderd]",
        lastName: "[verwijderd]",
        email: "[verwijderd]",
        phone: "[verwijderd]",
        address: "[verwijderd]",
      }),
    );
  });

  it("clears questionnaireAnswers and notes", async () => {
    await anonymizeAdoptionCandidate(1);

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        questionnaireAnswers: {},
        notes: null,
      }),
    );
  });

  it("sets anonymisedAt timestamp", async () => {
    await anonymizeAdoptionCandidate(1);

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        anonymisedAt: expect.any(Date),
      }),
    );
  });

  it("anonymises matching mailing_send_recipients by email", async () => {
    await anonymizeAdoptionCandidate(1);

    // update is called twice: once for candidate, once for mailing_send_recipients
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it("returns the old record for audit logging", async () => {
    const result = await anonymizeAdoptionCandidate(1);

    expect(result).toEqual(mockCandidate);
  });
});

describe("anonymizeWalker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectLimit.mockResolvedValue([mockWalker]);
    mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning });
    mockUpdateReturning.mockResolvedValue([{ ...mockWalker, firstName: "[verwijderd]" }]);
    mockDel.mockResolvedValue(undefined);
  });

  it("returns null when walker not found", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await anonymizeWalker(999);

    expect(result).toBeNull();
  });

  it("returns null when walker already anonymised", async () => {
    mockSelectLimit.mockResolvedValue([{ ...mockWalker, anonymisedAt: new Date() }]);

    const result = await anonymizeWalker(5);

    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates PII fields to [verwijderd]", async () => {
    await anonymizeWalker(5);

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "[verwijderd]",
        lastName: "[verwijderd]",
        email: "[verwijderd]",
        phone: "[verwijderd]",
        address: "[verwijderd]",
      }),
    );
  });

  it("clears allergies and sets dateOfBirth to anonymised value", async () => {
    await anonymizeWalker(5);

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        allergies: null,
        dateOfBirth: "1970-01-01",
      }),
    );
  });

  it("clears photoUrl, childrenWalkAlong, and rejectionReason", async () => {
    await anonymizeWalker(5);

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        photoUrl: null,
        childrenWalkAlong: false,
        rejectionReason: null,
      }),
    );
  });

  it("deletes photo from Vercel Blob when photoUrl exists", async () => {
    await anonymizeWalker(5);

    expect(mockDel).toHaveBeenCalledWith(mockWalker.photoUrl);
  });

  it("does NOT call del when photoUrl is null", async () => {
    mockSelectLimit.mockResolvedValue([{ ...mockWalker, photoUrl: null }]);

    await anonymizeWalker(5);

    expect(mockDel).not.toHaveBeenCalled();
  });

  it("continues anonymisation even when blob delete fails", async () => {
    mockDel.mockRejectedValue(new Error("Blob not found"));

    const result = await anonymizeWalker(5);

    // Should still return old record (anonymisation succeeded in DB)
    expect(result).toEqual(mockWalker);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("deactivates and anonymises linked user when userId exists", async () => {
    await anonymizeWalker(5);

    // update called 3 times: walker, user, mailing_send_recipients
    expect(mockUpdate).toHaveBeenCalledTimes(3);
    // Check user update includes isActive: false
    const secondUpdateCall = mockUpdateSet.mock.calls[1];
    expect(secondUpdateCall[0]).toEqual(
      expect.objectContaining({
        name: "[verwijderd]",
        isActive: false,
      }),
    );
  });

  it("does NOT update user when userId is null", async () => {
    mockSelectLimit.mockResolvedValue([{ ...mockWalker, userId: null }]);

    await anonymizeWalker(5);

    // update called 2 times: walker, mailing_send_recipients (no user update)
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it("anonymises matching mailing_send_recipients by email", async () => {
    await anonymizeWalker(5);

    // Last update call should be for mailing_send_recipients
    const lastCall = mockUpdateSet.mock.calls[mockUpdateSet.mock.calls.length - 1];
    expect(lastCall[0]).toEqual(
      expect.objectContaining({
        email: "[verwijderd]",
        recipientName: "[verwijderd]",
      }),
    );
  });

  it("sets anonymisedAt timestamp on walker", async () => {
    await anonymizeWalker(5);

    const firstUpdateCall = mockUpdateSet.mock.calls[0];
    expect(firstUpdateCall[0]).toEqual(
      expect.objectContaining({
        anonymisedAt: expect.any(Date),
      }),
    );
  });

  it("returns the old record for audit logging", async () => {
    const result = await anonymizeWalker(5);

    expect(result).toEqual(mockWalker);
  });
});
