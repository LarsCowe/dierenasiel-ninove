import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mocks for Drizzle chaining
const { mockResults } = vi.hoisted(() => {
  const mockResults: unknown[][] = [];
  return { mockResults };
});

// Mock db with chainable select
vi.mock("@/lib/db", () => {
  let callIndex = 0;

  const createChain = () => {
    const chain: Record<string, unknown> = {};
    const resolve = () => {
      const result = mockResults[callIndex] ?? [];
      callIndex++;
      return Promise.resolve(result);
    };
    // Each method returns chain or resolves
    chain.from = vi.fn().mockReturnValue(chain);
    chain.where = vi.fn().mockReturnValue(chain);
    chain.groupBy = vi.fn().mockImplementation(() => resolve());
    chain.orderBy = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockImplementation(() => resolve());
    chain.then = vi.fn().mockImplementation((fn: (v: unknown) => unknown) => resolve().then(fn));
    return chain;
  };

  return {
    db: {
      select: vi.fn().mockImplementation(() => {
        return createChain();
      }),
      // Reset call index between tests
      _resetIndex: () => { callIndex = 0; },
    },
  };
});

vi.mock("@/lib/db/schema", () => ({
  animals: { species: "species", status: "status", adoptedDate: "adopted_date", id: "id", name: "name" },
  contactSubmissions: { isRead: "is_read" },
  users: { isActive: "is_active" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => args),
  sql: (() => {
    const fn = (strings: TemplateStringsArray, ..._values: unknown[]) => strings.join("?");
    fn.raw = vi.fn();
    return fn;
  })(),
  desc: vi.fn((col: unknown) => col),
  isNotNull: vi.fn((col: unknown) => col),
  and: vi.fn((...args: unknown[]) => args),
  count: vi.fn(),
}));

import { getDashboardStats } from "./dashboard";
import { db } from "@/lib/db";

describe("getDashboardStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns correct DashboardStats structure", async () => {
    // Setup mock results for 6 parallel queries
    mockResults.push(
      [{ species: "hond", count: 10 }, { species: "kat", count: 5 }], // animalsBySpecies
      [{ status: "beschikbaar", count: 8 }], // animalsByStatus
      [{ id: 1, name: "Rex", species: "hond", adoptedDate: "2026-01-15" }], // recentAdoptions
      [{ count: 3 }], // unreadMessages
      [{ count: 2 }], // activeUsers
      [{ count: 15 }], // totalAnimals
    );

    const stats = await getDashboardStats();

    expect(stats).toHaveProperty("animalsBySpecies");
    expect(stats).toHaveProperty("animalsByStatus");
    expect(stats).toHaveProperty("recentAdoptions");
    expect(stats).toHaveProperty("unreadMessages");
    expect(stats).toHaveProperty("activeUsers");
    expect(stats).toHaveProperty("totalAnimals");
  });

  it("counts animals per species correctly", async () => {
    mockResults.push(
      [{ species: "hond", count: 10 }, { species: "kat", count: 5 }, { species: "konijn", count: 2 }],
      [{ status: "beschikbaar", count: 17 }],
      [],
      [{ count: 0 }],
      [{ count: 1 }],
      [{ count: 17 }],
    );

    const stats = await getDashboardStats();

    expect(stats.animalsBySpecies).toEqual([
      { species: "hond", count: 10 },
      { species: "kat", count: 5 },
      { species: "konijn", count: 2 },
    ]);
  });

  it("counts animals per status correctly", async () => {
    mockResults.push(
      [{ species: "hond", count: 5 }],
      [{ status: "beschikbaar", count: 3 }, { status: "in_behandeling", count: 2 }],
      [],
      [{ count: 0 }],
      [{ count: 1 }],
      [{ count: 5 }],
    );

    const stats = await getDashboardStats();

    expect(stats.animalsByStatus).toEqual([
      { status: "beschikbaar", count: 3 },
      { status: "in_behandeling", count: 2 },
    ]);
  });

  it("returns recent adoptions sorted by date desc, max 5", async () => {
    const adoptions = [
      { id: 3, name: "Luna", species: "kat", adoptedDate: "2026-02-20" },
      { id: 1, name: "Rex", species: "hond", adoptedDate: "2026-02-15" },
    ];
    mockResults.push(
      [{ species: "hond", count: 2 }],
      [{ status: "geadopteerd", count: 2 }],
      adoptions,
      [{ count: 0 }],
      [{ count: 1 }],
      [{ count: 2 }],
    );

    const stats = await getDashboardStats();

    expect(stats.recentAdoptions).toEqual(adoptions);
    expect(stats.recentAdoptions.length).toBeLessThanOrEqual(5);
  });

  it("returns zeros and empty arrays for empty database (AC5)", async () => {
    mockResults.push(
      [], // no animals by species
      [], // no animals by status
      [], // no adoptions
      [{ count: 0 }], // no unread messages
      [{ count: 0 }], // no active users
      [{ count: 0 }], // no total animals
    );

    const stats = await getDashboardStats();

    expect(stats.animalsBySpecies).toEqual([]);
    expect(stats.animalsByStatus).toEqual([]);
    expect(stats.recentAdoptions).toEqual([]);
    expect(stats.unreadMessages).toBe(0);
    expect(stats.activeUsers).toBe(0);
    expect(stats.totalAnimals).toBe(0);
  });

  it("counts unread messages correctly", async () => {
    mockResults.push(
      [],
      [],
      [],
      [{ count: 7 }],
      [{ count: 3 }],
      [{ count: 0 }],
    );

    const stats = await getDashboardStats();

    expect(stats.unreadMessages).toBe(7);
    expect(stats.activeUsers).toBe(3);
  });

  it("includes animals adopted via uitstroom-registratie flow (adoptedDate set by registerOuttake)", async () => {
    // Simuleert een dier geadopteerd via registerOuttake(id, "adoptie", "2026-04-15")
    // waarbij adoptedDate nu correct wordt gezet op gelijke waarde als outtakeDate.
    const uitstroomAdoption = {
      id: 42,
      name: "Bello",
      species: "hond",
      adoptedDate: "2026-04-15",
    };
    mockResults.push(
      [{ species: "hond", count: 1 }],
      [{ status: "geadopteerd", count: 1 }],
      [uitstroomAdoption],
      [{ count: 0 }],
      [{ count: 1 }],
      [{ count: 1 }],
    );

    const stats = await getDashboardStats();

    expect(stats.recentAdoptions).toContainEqual(uitstroomAdoption);
    expect(stats.recentAdoptions[0].adoptedDate).toBe("2026-04-15");
  });

  it("returns empty stats when database query fails (graceful fallback)", async () => {
    // Make the first query reject — Promise.all will reject
    mockResults.length = 0;
    // Override select to throw
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });

    const stats = await getDashboardStats();

    expect(stats.animalsBySpecies).toEqual([]);
    expect(stats.animalsByStatus).toEqual([]);
    expect(stats.recentAdoptions).toEqual([]);
    expect(stats.unreadMessages).toBe(0);
    expect(stats.activeUsers).toBe(0);
    expect(stats.totalAnimals).toBe(0);
  });
});
