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
    chain.groupBy = vi.fn().mockReturnValue(chain);
    chain.leftJoin = vi.fn().mockReturnValue(chain);
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
  kennels: {
    id: "id",
    code: "code",
    zone: "zone",
    capacity: "capacity",
    isActive: "is_active",
    notes: "notes",
  },
  animals: {
    id: "animals_id",
    kennelId: "kennel_id",
    isInShelter: "is_in_shelter",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  sql: vi.fn((strings: TemplateStringsArray) => ({ type: "sql", value: strings.join("") })),
  count: vi.fn((col: unknown) => ({ type: "count", col })),
  asc: vi.fn((col: unknown) => ({ type: "asc", col })),
}));

import { getKennels, getKennelOccupancy, getAnimalsInKennels } from "./kennels";
import { db } from "@/lib/db";

describe("getKennels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns all active kennels ordered by zone and code", async () => {
    const kennelsList = [
      { id: 1, code: "A1", zone: "andere", capacity: 2, isActive: true, notes: null },
      { id: 2, code: "H1", zone: "honden", capacity: 2, isActive: true, notes: null },
      { id: 3, code: "K1", zone: "katten", capacity: 3, isActive: true, notes: null },
    ];
    mockResults.push(kennelsList);

    const result = await getKennels();

    expect(result).toEqual(kennelsList);
  });

  it("returns empty array when no kennels exist", async () => {
    mockResults.push([]);

    const result = await getKennels();

    expect(result).toEqual([]);
  });

  it("returns empty array on database error", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });

    const result = await getKennels();

    expect(result).toEqual([]);
  });
});

describe("getKennelOccupancy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns kennels with occupancy count", async () => {
    const occupancy = [
      { kennel: { id: 1, code: "H1", zone: "honden", capacity: 2, isActive: true, notes: null }, count: 1 },
      { kennel: { id: 2, code: "H2", zone: "honden", capacity: 2, isActive: true, notes: null }, count: 0 },
    ];
    mockResults.push(occupancy);

    const result = await getKennelOccupancy();

    expect(result).toEqual(occupancy);
  });

  it("returns empty array on database error", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });

    const result = await getKennelOccupancy();

    expect(result).toEqual([]);
  });
});

describe("getAnimalsInKennels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns animals grouped by kennel id", async () => {
    const animalsList = [
      { id: 1, name: "Rex", kennelId: 5, isInShelter: true, species: "hond" },
      { id: 2, name: "Bella", kennelId: 5, isInShelter: true, species: "hond" },
      { id: 3, name: "Minou", kennelId: 8, isInShelter: true, species: "kat" },
    ];
    mockResults.push(animalsList);

    const result = await getAnimalsInKennels();

    expect(result[5]).toHaveLength(2);
    expect(result[5]![0]!.name).toBe("Rex");
    expect(result[8]).toHaveLength(1);
    expect(result[8]![0]!.name).toBe("Minou");
  });

  it("returns empty object when no animals are in kennels", async () => {
    mockResults.push([]);

    const result = await getAnimalsInKennels();

    expect(result).toEqual({});
  });

  it("returns empty object on database error", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });

    const result = await getAnimalsInKennels();

    expect(result).toEqual({});
  });
});
