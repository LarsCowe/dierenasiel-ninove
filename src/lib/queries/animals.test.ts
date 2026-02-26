import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mocks for Drizzle chaining
const { mockResults, mockWhere, mockOrderBy, mockLimit, mockOffset } = vi.hoisted(() => {
  const mockResults: unknown[][] = [];
  const mockWhere = vi.fn();
  const mockOrderBy = vi.fn();
  const mockLimit = vi.fn();
  const mockOffset = vi.fn();
  return { mockResults, mockWhere, mockOrderBy, mockLimit, mockOffset };
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
    chain.where = mockWhere.mockReturnValue(chain);
    chain.orderBy = mockOrderBy.mockReturnValue(chain);
    chain.limit = mockLimit.mockReturnValue(chain);
    chain.offset = mockOffset.mockImplementation(() => resolve());
    // count query resolves via groupBy or then
    chain.groupBy = vi.fn().mockImplementation(() => resolve());
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
  animals: {
    name: "name",
    species: "species",
    status: "status",
    identificationNr: "identification_nr",
    intakeDate: "intake_date",
    createdAt: "created_at",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  or: vi.fn((...args: unknown[]) => ({ type: "or", args })),
  ilike: vi.fn((...args: unknown[]) => ({ type: "ilike", args })),
  desc: vi.fn((col: unknown) => ({ type: "desc", col })),
  asc: vi.fn((col: unknown) => ({ type: "asc", col })),
  sql: (() => {
    const fn = (strings: TemplateStringsArray, ..._values: unknown[]) => strings.join("?");
    fn.raw = vi.fn();
    return fn;
  })(),
  ne: vi.fn((...args: unknown[]) => ({ type: "ne", args })),
  isNotNull: vi.fn((col: unknown) => ({ type: "isNotNull", col })),
  count: vi.fn(),
}));

import { getAnimalsForAdmin, getAnimalById, getIbnDeadlineAlerts } from "./animals";
import { db } from "@/lib/db";

describe("getAnimalsForAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns animals and total count", async () => {
    const animals = [
      { id: 1, name: "Rex", species: "hond", status: "beschikbaar" },
      { id: 2, name: "Luna", species: "kat", status: "beschikbaar" },
    ];
    mockResults.push(animals, [{ count: 2 }]);

    const result = await getAnimalsForAdmin();

    expect(result.animals).toEqual(animals);
    expect(result.total).toBe(2);
  });

  it("filters by species when provided", async () => {
    mockResults.push(
      [{ id: 1, name: "Rex", species: "hond" }],
      [{ count: 1 }],
    );

    await getAnimalsForAdmin({ species: "hond" });

    expect(mockWhere).toHaveBeenCalled();
  });

  it("filters by status when provided", async () => {
    mockResults.push(
      [{ id: 1, name: "Rex", status: "beschikbaar" }],
      [{ count: 1 }],
    );

    await getAnimalsForAdmin({ status: "beschikbaar" });

    expect(mockWhere).toHaveBeenCalled();
  });

  it("searches by name using ILIKE", async () => {
    mockResults.push(
      [{ id: 1, name: "Rex" }],
      [{ count: 1 }],
    );

    const { ilike } = await import("drizzle-orm");
    await getAnimalsForAdmin({ search: "Rex" });

    expect(ilike).toHaveBeenCalled();
  });

  it("searches by chipnummer using ILIKE", async () => {
    mockResults.push(
      [{ id: 1, name: "Rex", identificationNr: "981100004567890" }],
      [{ count: 1 }],
    );

    const { ilike } = await import("drizzle-orm");
    await getAnimalsForAdmin({ search: "981100" });

    expect(ilike).toHaveBeenCalledTimes(2); // name + identificationNr
  });

  it("combines multiple filters", async () => {
    mockResults.push(
      [{ id: 1, name: "Rex", species: "hond", status: "beschikbaar" }],
      [{ count: 1 }],
    );

    const { and: andFn } = await import("drizzle-orm");
    await getAnimalsForAdmin({ species: "hond", status: "beschikbaar", search: "Rex" });

    expect(andFn).toHaveBeenCalled();
  });

  it("paginates with limit and offset", async () => {
    mockResults.push([], [{ count: 50 }]);

    await getAnimalsForAdmin({ page: 3, pageSize: 10 });

    expect(mockLimit).toHaveBeenCalledWith(10);
    expect(mockOffset).toHaveBeenCalledWith(20); // (3-1) * 10
  });

  it("defaults to page 1 with pageSize 25", async () => {
    mockResults.push([], [{ count: 0 }]);

    await getAnimalsForAdmin();

    expect(mockLimit).toHaveBeenCalledWith(25);
    expect(mockOffset).toHaveBeenCalledWith(0);
  });

  it("returns empty list and zero total when no results", async () => {
    mockResults.push([], [{ count: 0 }]);

    const result = await getAnimalsForAdmin();

    expect(result.animals).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("escapes LIKE wildcards in search term", async () => {
    mockResults.push([], [{ count: 0 }]);

    const { ilike } = await import("drizzle-orm");
    await getAnimalsForAdmin({ search: "100%" });

    expect(ilike).toHaveBeenCalledWith("name", "%100\\%%");
    expect(ilike).toHaveBeenCalledWith("identification_nr", "%100\\%%");
  });

  it("returns empty result on database error (graceful fallback)", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });

    const result = await getAnimalsForAdmin();

    expect(result.animals).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe("getAnimalById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns the animal when found by ID", async () => {
    const animal = { id: 1, name: "Rex", species: "hond", status: "beschikbaar" };
    mockResults.push([animal]);

    const result = await getAnimalById(1);

    expect(result).toEqual(animal);
  });

  it("returns null when no animal found", async () => {
    mockResults.push([]);

    const result = await getAnimalById(999);

    expect(result).toBeNull();
  });

  it("returns null on database error (graceful fallback)", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });

    const result = await getAnimalById(1);

    expect(result).toBeNull();
  });
});

describe("getIbnDeadlineAlerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns animals with IBN deadline approaching (within 7 days)", async () => {
    const ibnAnimal = {
      id: 5,
      name: "Fido",
      species: "hond",
      intakeReason: "ibn",
      ibnDecisionDeadline: "2026-03-01",
      isInShelter: true,
    };
    mockResults.push([ibnAnimal]);

    const result = await getIbnDeadlineAlerts();

    expect(result).toEqual([ibnAnimal]);
  });

  it("returns empty array when no IBN deadlines approaching", async () => {
    mockResults.push([]);

    const result = await getIbnDeadlineAlerts();

    expect(result).toEqual([]);
  });

  it("returns empty array on database error (graceful fallback)", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });

    const result = await getIbnDeadlineAlerts();

    expect(result).toEqual([]);
  });

  it("calls db.select to query animals", async () => {
    mockResults.push([]);

    await getIbnDeadlineAlerts();

    expect(db.select).toHaveBeenCalled();
  });
});
