import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockFrom,
  mockWhere,
  mockOrderBy,
  mockLimit,
  mockOffset,
  mockInnerJoin,
  mockLeftJoin,
  mockGroupBy,
} = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockWhere: vi.fn(),
  mockOrderBy: vi.fn(),
  mockLimit: vi.fn(),
  mockOffset: vi.fn(),
  mockInnerJoin: vi.fn(),
  mockLeftJoin: vi.fn(),
  mockGroupBy: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: mockFrom,
    })),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  adoptionCandidates: {
    id: "adoptionCandidates.id",
    firstName: "adoptionCandidates.firstName",
    lastName: "adoptionCandidates.lastName",
    email: "adoptionCandidates.email",
    status: "adoptionCandidates.status",
    animalId: "adoptionCandidates.animalId",
  },
  adoptionContracts: {
    id: "adoptionContracts.id",
    candidateId: "adoptionContracts.candidateId",
    animalId: "adoptionContracts.animalId",
    contractDate: "adoptionContracts.contractDate",
  },
  animals: {
    id: "animals.id",
    name: "animals.name",
    species: "animals.species",
  },
  mailingSends: {
    id: "mailingSends.id",
    subject: "mailingSends.subject",
    templateName: "mailingSends.templateName",
    fromEmail: "mailingSends.fromEmail",
    recipientCount: "mailingSends.recipientCount",
    sentBy: "mailingSends.sentBy",
    createdAt: "mailingSends.createdAt",
  },
  mailingSendRecipients: {
    id: "mailingSendRecipients.id",
    sendId: "mailingSendRecipients.sendId",
    email: "mailingSendRecipients.email",
    recipientName: "mailingSendRecipients.recipientName",
    animalName: "mailingSendRecipients.animalName",
    status: "mailingSendRecipients.status",
    sentAt: "mailingSendRecipients.sentAt",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  desc: vi.fn((col: unknown) => ({ type: "desc", col })),
  gte: vi.fn((...args: unknown[]) => ({ type: "gte", args })),
  lte: vi.fn((...args: unknown[]) => ({ type: "lte", args })),
  sql: vi.fn(),
}));

import {
  getMailingRecipients,
  getMailingSends,
  getMailingSendRecipients,
} from "./mailing";

describe("getMailingRecipients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      innerJoin: mockInnerJoin,
      leftJoin: mockLeftJoin,
      where: mockWhere,
      orderBy: mockOrderBy,
      groupBy: mockGroupBy,
    });
    mockInnerJoin.mockReturnValue({
      innerJoin: mockInnerJoin,
      where: mockWhere,
      orderBy: mockOrderBy,
      groupBy: mockGroupBy,
    });
    mockWhere.mockReturnValue({
      orderBy: mockOrderBy,
    });
    mockOrderBy.mockResolvedValue([]);
  });

  it("returns empty array when no recipients found", async () => {
    const result = await getMailingRecipients({});
    expect(result).toEqual([]);
    expect(mockFrom).toHaveBeenCalled();
  });

  it("returns recipients from adoption data", async () => {
    const mockData = [
      {
        candidateId: 1,
        firstName: "Jan",
        lastName: "Peeters",
        email: "jan@test.be",
        animalName: "Rex",
        contractDate: "2026-01-15",
      },
    ];
    mockOrderBy.mockResolvedValue(mockData);

    const result = await getMailingRecipients({});
    expect(result).toEqual(mockData);
  });

  it("applies dateFrom filter", async () => {
    mockOrderBy.mockResolvedValue([]);

    await getMailingRecipients({ dateFrom: "2026-01-01" });

    expect(mockWhere).toHaveBeenCalled();
  });

  it("applies dateTo filter", async () => {
    mockOrderBy.mockResolvedValue([]);

    await getMailingRecipients({ dateTo: "2026-12-31" });

    expect(mockWhere).toHaveBeenCalled();
  });

  it("applies species filter", async () => {
    mockOrderBy.mockResolvedValue([]);

    await getMailingRecipients({ species: "hond" });

    expect(mockWhere).toHaveBeenCalled();
  });

  it("applies all filters combined", async () => {
    mockOrderBy.mockResolvedValue([]);

    await getMailingRecipients({
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      species: "kat",
    });

    expect(mockWhere).toHaveBeenCalled();
  });

  it("returns empty array on query error", async () => {
    mockOrderBy.mockRejectedValue(new Error("DB error"));

    const result = await getMailingRecipients({});
    expect(result).toEqual([]);
  });
});

describe("getMailingSends", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      orderBy: mockOrderBy,
      where: mockWhere,
      innerJoin: mockInnerJoin,
      leftJoin: mockLeftJoin,
      groupBy: mockGroupBy,
    });
    mockOrderBy.mockResolvedValue([]);
  });

  it("returns empty array when no sends found", async () => {
    const result = await getMailingSends();
    expect(result).toEqual([]);
    expect(mockFrom).toHaveBeenCalled();
  });

  it("returns sends ordered by createdAt DESC", async () => {
    const mockData = [
      {
        id: 1,
        subject: "Opvolging",
        templateName: "follow_up_1_week",
        fromEmail: "honden@dierenasielninove.be",
        recipientCount: 5,
        sentBy: 1,
        createdAt: new Date("2026-03-01"),
      },
    ];
    mockOrderBy.mockResolvedValue(mockData);

    const result = await getMailingSends();
    expect(result).toEqual(mockData);
  });

  it("returns empty array on query error", async () => {
    mockOrderBy.mockRejectedValue(new Error("DB error"));

    const result = await getMailingSends();
    expect(result).toEqual([]);
  });
});

describe("getMailingSendRecipients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
      innerJoin: mockInnerJoin,
      leftJoin: mockLeftJoin,
      groupBy: mockGroupBy,
    });
    mockWhere.mockReturnValue({
      orderBy: mockOrderBy,
    });
    mockOrderBy.mockResolvedValue([]);
  });

  it("returns recipients for a given sendId", async () => {
    const mockData = [
      {
        id: 1,
        sendId: 10,
        email: "jan@test.be",
        recipientName: "Jan Peeters",
        animalName: "Rex",
        status: "sent",
        sentAt: new Date("2026-03-01"),
      },
    ];
    mockOrderBy.mockResolvedValue(mockData);

    const result = await getMailingSendRecipients(10);
    expect(result).toEqual(mockData);
    expect(mockWhere).toHaveBeenCalled();
  });

  it("returns empty array when no recipients found", async () => {
    const result = await getMailingSendRecipients(999);
    expect(result).toEqual([]);
  });

  it("returns empty array on query error", async () => {
    mockOrderBy.mockRejectedValue(new Error("DB error"));

    const result = await getMailingSendRecipients(1);
    expect(result).toEqual([]);
  });
});
