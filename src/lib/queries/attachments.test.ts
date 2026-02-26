import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockResults } = vi.hoisted(() => {
  const mockResults: unknown[][] = [];
  return { mockResults };
});

vi.mock("@/lib/db", () => {
  let callIndex = 0;
  const createChain = () => {
    const chain: Record<string, unknown> = {};
    const resolve = () => {
      const result = mockResults[callIndex] ?? [];
      callIndex++;
      return Promise.resolve(result);
    };
    chain.from = vi.fn().mockReturnValue(chain);
    chain.where = vi.fn().mockReturnValue(chain);
    chain.orderBy = vi.fn().mockImplementation(() => resolve());
    chain.then = vi.fn().mockImplementation((fn: (v: unknown) => unknown) => resolve().then(fn));
    return chain;
  };
  return {
    db: {
      select: vi.fn().mockImplementation(() => createChain()),
      _resetIndex: () => { callIndex = 0; },
    },
  };
});

vi.mock("@/lib/db/schema", () => ({
  animalAttachments: {
    animalId: "animal_id",
    uploadedAt: "uploaded_at",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  desc: vi.fn((col: unknown) => ({ type: "desc", col })),
}));

import { getAttachmentsByAnimalId } from "./attachments";
import { db } from "@/lib/db";

describe("getAttachmentsByAnimalId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns attachments sorted by uploaded_at desc", async () => {
    const attachments = [
      { id: 2, animalId: 1, fileName: "foto2.jpg", uploadedAt: "2026-02-26" },
      { id: 1, animalId: 1, fileName: "foto1.jpg", uploadedAt: "2026-02-25" },
    ];
    mockResults.push(attachments);

    const result = await getAttachmentsByAnimalId(1);

    expect(result).toEqual(attachments);
  });

  it("returns empty array when no attachments exist", async () => {
    mockResults.push([]);

    const result = await getAttachmentsByAnimalId(999);

    expect(result).toEqual([]);
  });

  it("returns empty array on database error (graceful fallback)", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });

    const result = await getAttachmentsByAnimalId(1);

    expect(result).toEqual([]);
  });
});
