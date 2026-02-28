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
    chain.innerJoin = vi.fn().mockReturnValue(chain);
    chain.orderBy = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockImplementation(() => resolve());
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
  postAdoptionFollowups: {
    id: "id",
    contractId: "contract_id",
    followupType: "followup_type",
    date: "date",
    status: "status",
    notes: "notes",
    createdAt: "created_at",
  },
  adoptionContracts: {
    id: "contracts_id",
    animalId: "contracts_animal_id",
    candidateId: "contracts_candidate_id",
  },
  adoptionCandidates: {
    id: "candidates_id",
    firstName: "first_name",
    lastName: "last_name",
    phone: "phone",
  },
  animals: {
    id: "animals_id",
    name: "animals_name",
    species: "animals_species",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  asc: vi.fn((col: unknown) => ({ type: "asc", col })),
}));

import { getFollowupsByContractId, getPlannedFollowupsForOverview } from "./post-adoption-followups";
import { db } from "@/lib/db";

// ─── getFollowupsByContractId ────────────────────────────────────────

describe("getFollowupsByContractId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns followups ordered by date", async () => {
    const followups = [
      { id: 1, contractId: 5, followupType: "1_week", date: "2026-03-22", status: "planned" },
      { id: 2, contractId: 5, followupType: "1_month", date: "2026-04-14", status: "planned" },
    ];
    mockResults.push(followups);

    const result = await getFollowupsByContractId(5);
    expect(result).toEqual(followups);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no followups exist", async () => {
    mockResults.push([]);
    const result = await getFollowupsByContractId(999);
    expect(result).toEqual([]);
  });

  it("returns empty array on database error", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });
    const result = await getFollowupsByContractId(1);
    expect(result).toEqual([]);
  });
});

// ─── getPlannedFollowupsForOverview ──────────────────────────────────

describe("getPlannedFollowupsForOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns planned followups with animal and candidate info", async () => {
    const rows = [
      {
        followup: { id: 1, followupType: "1_week", date: "2026-03-22", status: "planned", contractId: 5 },
        animal: { id: 10, name: "Buddy", species: "hond" },
        candidate: { id: 2, firstName: "Marie", lastName: "Janssens", phone: "0471234567" },
      },
    ];
    mockResults.push(rows);

    const result = await getPlannedFollowupsForOverview();
    expect(result).toHaveLength(1);
    expect(result[0].followup.id).toBe(1);
    expect(result[0].animal.name).toBe("Buddy");
    expect(result[0].candidate.firstName).toBe("Marie");
  });

  it("returns empty array when no planned followups", async () => {
    mockResults.push([]);
    const result = await getPlannedFollowupsForOverview();
    expect(result).toEqual([]);
  });

  it("returns empty array on database error", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });
    const result = await getPlannedFollowupsForOverview();
    expect(result).toEqual([]);
  });
});
