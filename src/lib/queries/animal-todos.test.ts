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
  animalTodos: {
    id: "id",
    animalId: "animal_id",
    isCompleted: "is_completed",
    dueDate: "due_date",
    priority: "priority",
    completedAt: "completed_at",
    createdAt: "created_at",
  },
  animals: {
    id: "animals_id",
    name: "name",
    species: "species",
    imageUrl: "image_url",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  desc: vi.fn((col: unknown) => ({ type: "desc", col })),
  asc: vi.fn((col: unknown) => ({ type: "asc", col })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
  count: vi.fn(() => "count(*)"),
  sql: vi.fn(),
}));

import { getTodosByAnimalId, getOpenTodosForDashboard, countOpenTodosByAnimalId } from "./animal-todos";
import { db } from "@/lib/db";

describe("getTodosByAnimalId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns todos for an animal", async () => {
    const todos = [
      { id: 1, animalId: 10, type: "vaccinatie", description: "Eerste vaccinatie", isCompleted: false },
      { id: 2, animalId: 10, type: "chip", description: "Chip plaatsen", isCompleted: true },
    ];
    mockResults.push(todos);

    const result = await getTodosByAnimalId(10);
    expect(result).toEqual(todos);
  });

  it("returns empty array when no todos exist", async () => {
    mockResults.push([]);
    const result = await getTodosByAnimalId(999);
    expect(result).toEqual([]);
  });

  it("returns empty array on database error", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });
    const result = await getTodosByAnimalId(1);
    expect(result).toEqual([]);
  });
});

describe("getOpenTodosForDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns open todos with animal info", async () => {
    const rows = [
      {
        todo: { id: 1, type: "vaccinatie", description: "Eerste vaccinatie", dueDate: "2026-03-01", priority: "hoog", animalId: 10 },
        animal: { id: 10, name: "Rex", species: "hond", imageUrl: null },
      },
    ];
    mockResults.push(rows);

    const result = await getOpenTodosForDashboard();
    expect(result).toHaveLength(1);
    expect(result[0].todo.id).toBe(1);
    expect(result[0].animal.name).toBe("Rex");
  });

  it("returns empty array when no open todos", async () => {
    mockResults.push([]);
    const result = await getOpenTodosForDashboard();
    expect(result).toEqual([]);
  });

  it("respects custom limit", async () => {
    mockResults.push([]);
    await getOpenTodosForDashboard(5);
    expect(db.select).toHaveBeenCalled();
  });

  it("returns empty array on database error", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });
    const result = await getOpenTodosForDashboard();
    expect(result).toEqual([]);
  });
});

describe("countOpenTodosByAnimalId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults.length = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any)._resetIndex();
  });

  it("returns count of open todos", async () => {
    mockResults.push([{ count: 3 }]);
    const result = await countOpenTodosByAnimalId(10);
    expect(result).toBe(3);
  });

  it("returns 0 when no open todos", async () => {
    mockResults.push([{ count: 0 }]);
    const result = await countOpenTodosByAnimalId(999);
    expect(result).toBe(0);
  });

  it("returns 0 on database error", async () => {
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error("Connection refused");
    });
    const result = await countOpenTodosByAnimalId(1);
    expect(result).toBe(0);
  });
});
