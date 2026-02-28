import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSelectLimit, mockSelectWhere, mockSelectFrom } = vi.hoisted(() => {
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
  adoptionContracts: { candidateId: Symbol("adoptionContracts.candidateId") },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));

import { getContractByCandidateId } from "./adoption-contracts";

const mockContract = {
  id: 1,
  animalId: 5,
  candidateId: 1,
  contractDate: "2026-03-15",
  paymentAmount: "150.00",
  paymentMethod: "payconiq",
  dogidCatidTransferDeadline: "2026-03-29",
  dogidCatidTransferred: false,
};

describe("getContractByCandidateId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns contract when found", async () => {
    mockSelectLimit.mockResolvedValue([mockContract]);
    const result = await getContractByCandidateId(1);
    expect(result).toEqual(mockContract);
  });

  it("returns null when no contract found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await getContractByCandidateId(999);
    expect(result).toBeNull();
  });

  it("returns null on DB error", async () => {
    mockSelectLimit.mockRejectedValue(new Error("DB down"));
    const result = await getContractByCandidateId(1);
    expect(result).toBeNull();
  });
});
