import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockSelectLimit, mockSelectWhere, mockSelectFrom,
} = vi.hoisted(() => {
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  return { mockSelectLimit, mockSelectWhere, mockSelectFrom };
});

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  shelterSettings: {
    key: Symbol("shelterSettings.key"),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));

import { getWalkingClubThreshold } from "./shelter-settings";

describe("getWalkingClubThreshold", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectWhere.mockReturnValue({ limit: mockSelectLimit });
    mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
  });

  it("returns threshold value from DB", async () => {
    mockSelectLimit.mockResolvedValue([{ key: "walking_club_threshold", value: "15" }]);
    const result = await getWalkingClubThreshold();
    expect(result).toBe(15);
  });

  it("returns default 10 when not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await getWalkingClubThreshold();
    expect(result).toBe(10);
  });

  it("returns default 10 on DB error", async () => {
    mockSelectLimit.mockRejectedValue(new Error("DB error"));
    const result = await getWalkingClubThreshold();
    expect(result).toBe(10);
  });
});
