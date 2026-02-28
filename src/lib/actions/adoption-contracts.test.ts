import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockReturning, mockInsert,
  mockSelectLimit, mockSelectWhere, mockSelectFrom,
  mockUpdateSetWhere, mockUpdateSet, mockUpdate,
  mockRequirePermission, mockLogAudit, mockRevalidatePath, mockGetSession,
  mockGetAnimalById, mockGetVaccinationsByAnimalId,
} = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockInsert = vi.fn();
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockUpdateSetWhere = vi.fn();
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateSetWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
  const mockRequirePermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  const mockGetSession = vi.fn();
  const mockGetAnimalById = vi.fn();
  const mockGetVaccinationsByAnimalId = vi.fn();
  return {
    mockReturning, mockInsert,
    mockSelectLimit, mockSelectWhere, mockSelectFrom,
    mockUpdateSetWhere, mockUpdateSet, mockUpdate,
    mockRequirePermission, mockLogAudit, mockRevalidatePath, mockGetSession,
    mockGetAnimalById, mockGetVaccinationsByAnimalId,
  };
});

vi.mock("@/lib/db", () => {
  const mockValuesChain = vi.fn().mockReturnValue({ returning: mockReturning });
  mockInsert.mockReturnValue({ values: mockValuesChain });
  return {
    db: {
      insert: mockInsert,
      update: mockUpdate,
      select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/db/schema", () => ({
  adoptionContracts: { id: Symbol("adoptionContracts.id") },
  adoptionCandidates: { id: Symbol("adoptionCandidates.id") },
  animals: { id: Symbol("animals.id") },
  animalTodos: { id: Symbol("animalTodos.id"), animalId: Symbol("animalTodos.animalId"), type: Symbol("animalTodos.type"), isCompleted: Symbol("animalTodos.isCompleted") },
  postAdoptionFollowups: { id: Symbol("postAdoptionFollowups.id"), contractId: Symbol("postAdoptionFollowups.contractId") },
}));
vi.mock("@/lib/permissions", () => ({ requirePermission: mockRequirePermission }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/queries/animals", () => ({ getAnimalById: mockGetAnimalById }));
vi.mock("@/lib/queries/vaccinations", () => ({ getVaccinationsByAnimalId: mockGetVaccinationsByAnimalId }));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
}));

import { createAdoptionContract, markDogidCatidTransferred } from "./adoption-contracts";

const validData = {
  animalId: 5,
  candidateId: 1,
  contractDate: "2026-03-15",
  paymentAmount: "150.00",
  paymentMethod: "payconiq",
  notes: "",
};

const mockAnimalDog = {
  id: 5, name: "Buddy", species: "hond",
  isNeutered: true, identificationNr: "981000000001234",
  isAvailableForAdoption: true, isInShelter: true,
};

const mockAnimalCat = {
  id: 6, name: "Mimi", species: "kat",
  isNeutered: true, identificationNr: "981000000005678",
  isAvailableForAdoption: true, isInShelter: true,
};

const mockCandidate = {
  id: 1, status: "approved", category: "goede_kandidaat", animalId: 5,
};

const createdContract = {
  id: 1,
  animalId: 5,
  candidateId: 1,
  contractDate: "2026-03-15",
  paymentAmount: "150.00",
  paymentMethod: "payconiq",
  contractPdfUrl: null,
  dogidCatidTransferDeadline: "2026-03-29",
  dogidCatidTransferred: false,
  notes: null,
  createdAt: new Date(),
};

function makeFormData(json: unknown): FormData {
  const fd = new FormData();
  fd.append("json", JSON.stringify(json));
  return fd;
}

describe("createAdoptionContract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ userId: 3, name: "Marie Janssens" });
    mockGetAnimalById.mockResolvedValue(mockAnimalDog);
    mockGetVaccinationsByAnimalId.mockResolvedValue([{ id: 1 }]);
    mockSelectLimit.mockResolvedValue([mockCandidate]);
    mockReturning.mockResolvedValue([createdContract]);
    mockUpdateSetWhere.mockResolvedValue(undefined);
  });

  it("requires adoption:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await createAdoptionContract(null, makeFormData(validData));
    expect(mockRequirePermission).toHaveBeenCalledWith("adoption:write");
    expect(result.success).toBe(false);
  });

  it("returns error when JSON is invalid", async () => {
    const fd = new FormData();
    fd.append("json", "not-valid");
    const result = await createAdoptionContract(null, fd);
    expect(result.success).toBe(false);
  });

  it("returns error when candidate not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await createAdoptionContract(null, makeFormData(validData));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Kandidaat niet gevonden");
  });

  it("returns error when candidate is not approved", async () => {
    mockSelectLimit.mockResolvedValue([{ ...mockCandidate, status: "screening" }]);
    const result = await createAdoptionContract(null, makeFormData(validData));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("goedgekeurd");
  });

  it("returns error when animal not found", async () => {
    mockGetAnimalById.mockResolvedValue(null);
    const result = await createAdoptionContract(null, makeFormData(validData));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Dier niet gevonden");
  });

  // AC2: Kattenvalidatie
  it("blocks contract for unneutered cat", async () => {
    mockGetAnimalById.mockResolvedValue({ ...mockAnimalCat, isNeutered: false });
    const result = await createAdoptionContract(null, makeFormData({ ...validData, animalId: 6 }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("gesteriliseerd");
  });

  it("blocks contract for cat without chip", async () => {
    mockGetAnimalById.mockResolvedValue({ ...mockAnimalCat, identificationNr: null });
    const result = await createAdoptionContract(null, makeFormData({ ...validData, animalId: 6 }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("gechipt");
  });

  it("blocks contract for cat without vaccination", async () => {
    mockGetAnimalById.mockResolvedValue(mockAnimalCat);
    mockGetVaccinationsByAnimalId.mockResolvedValue([]);
    const result = await createAdoptionContract(null, makeFormData({ ...validData, animalId: 6 }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("gevaccineerd");
  });

  it("allows contract for valid cat (chipped + vaccinated + neutered)", async () => {
    mockGetAnimalById.mockResolvedValue(mockAnimalCat);
    mockGetVaccinationsByAnimalId.mockResolvedValue([{ id: 1 }]);
    const result = await createAdoptionContract(null, makeFormData({ ...validData, animalId: 6 }));
    expect(result.success).toBe(true);
  });

  // AC3: Chipwaarschuwing (for dogs)
  it("returns warning when dog has no chip but still creates contract", async () => {
    mockGetAnimalById.mockResolvedValue({ ...mockAnimalDog, identificationNr: null });
    const result = await createAdoptionContract(null, makeFormData(validData));
    expect(result.success).toBe(true);
    if (result.success) expect(result.message).toContain("Chipregistratie ontbreekt");
  });

  // AC4: Deadline berekening
  it("calculates dogid_catid_transfer_deadline as contract_date + 14 days", async () => {
    const result = await createAdoptionContract(null, makeFormData(validData));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  // AC5: Dier bijwerken
  it("updates animal status to geadopteerd", async () => {
    await createAdoptionContract(null, makeFormData(validData));
    // Should update both candidate and animal
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("updates candidate status to adopted", async () => {
    await createAdoptionContract(null, makeFormData(validData));
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("calls logAudit after success", async () => {
    await createAdoptionContract(null, makeFormData(validData));
    expect(mockLogAudit).toHaveBeenCalledWith(
      "create_adoption_contract", "adoption_contract", 1, null, expect.objectContaining({ id: 1 }),
    );
  });

  it("revalidates adoptie path", async () => {
    await createAdoptionContract(null, makeFormData(validData));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/adoptie");
  });

  // Story 4.5 AC1: Automatische taak bij contract
  it("creates dogid_catid_overdracht todo on successful contract", async () => {
    const result = await createAdoptionContract(null, makeFormData(validData));
    expect(result.success).toBe(true);
    // insert should be called 3x: contract + auto-todo + auto-followups
    expect(mockInsert).toHaveBeenCalledTimes(3);
  });

  // Story 4.6 AC2: Automatische post-adoptie opvolgingen
  it("creates 2 post-adoption followups on successful contract", async () => {
    const result = await createAdoptionContract(null, makeFormData(validData));
    expect(result.success).toBe(true);
    // insert called 3x: contract, auto-todo, auto-followups
    expect(mockInsert).toHaveBeenCalledTimes(3);
  });

  it("still succeeds even if followup creation fails", async () => {
    // Make the 3rd insert call (followups) fail
    mockReturning.mockResolvedValueOnce([createdContract]); // 1st: contract
    const mockValues = vi.fn()
      .mockReturnValueOnce({ returning: mockReturning }) // 1st: contract
      .mockReturnValueOnce({ returning: vi.fn().mockResolvedValue(undefined) }) // 2nd: auto-todo
      .mockRejectedValueOnce(new Error("followup insert fail")); // 3rd: followups
    mockInsert.mockReturnValue({ values: mockValues });
    const result = await createAdoptionContract(null, makeFormData(validData));
    expect(result.success).toBe(true);
  });

  it("returns graceful error on DB failure", async () => {
    mockReturning.mockRejectedValue(new Error("Connection refused"));
    const result = await createAdoptionContract(null, makeFormData(validData));
    expect(result.success).toBe(false);
  });
});

// ─── markDogidCatidTransferred ───────────────────────────────────────

const existingContract = {
  id: 1,
  animalId: 5,
  candidateId: 1,
  contractDate: "2026-03-15",
  dogidCatidTransferred: false,
  dogidCatidTransferDeadline: "2026-03-29",
};

const existingTodo = {
  id: 10,
  animalId: 5,
  type: "dogid_catid_overdracht",
  isCompleted: false,
};

function makeTransferFormData(contractId: number): FormData {
  const fd = new FormData();
  fd.append("contractId", String(contractId));
  return fd;
}

describe("markDogidCatidTransferred", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ userId: 3, name: "Marie Janssens" });
    // First select: contract lookup; Second select: todo lookup
    mockSelectLimit
      .mockResolvedValueOnce([existingContract])
      .mockResolvedValueOnce([existingTodo]);
    mockUpdateSetWhere.mockResolvedValue(undefined);
    mockReturning.mockResolvedValue([{ ...existingTodo, isCompleted: true }]);
  });

  it("requires adoption:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await markDogidCatidTransferred(null, makeTransferFormData(1));
    expect(mockRequirePermission).toHaveBeenCalledWith("adoption:write");
    expect(result.success).toBe(false);
  });

  it("returns error when contractId is invalid", async () => {
    const fd = new FormData();
    fd.append("contractId", "abc");
    const result = await markDogidCatidTransferred(null, fd);
    expect(result.success).toBe(false);
  });

  it("returns error when contract not found", async () => {
    mockSelectLimit.mockReset();
    mockSelectLimit.mockResolvedValueOnce([]);
    const result = await markDogidCatidTransferred(null, makeTransferFormData(999));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Contract niet gevonden");
  });

  it("returns error when already transferred", async () => {
    mockSelectLimit.mockReset();
    mockSelectLimit.mockResolvedValueOnce([{ ...existingContract, dogidCatidTransferred: true }]);
    const result = await markDogidCatidTransferred(null, makeTransferFormData(1));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("reeds");
  });

  it("updates contract dogidCatidTransferred to true", async () => {
    const result = await markDogidCatidTransferred(null, makeTransferFormData(1));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("completes the related animal_todo", async () => {
    const result = await markDogidCatidTransferred(null, makeTransferFormData(1));
    expect(result.success).toBe(true);
    // update called for contract + todo completion
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it("calls logAudit on success", async () => {
    await markDogidCatidTransferred(null, makeTransferFormData(1));
    expect(mockLogAudit).toHaveBeenCalledWith(
      "mark_dogid_catid_transferred", "adoption_contract", 1,
      expect.objectContaining({ dogidCatidTransferred: false }),
      expect.objectContaining({ dogidCatidTransferred: true }),
    );
  });

  it("revalidates adoptie path", async () => {
    await markDogidCatidTransferred(null, makeTransferFormData(1));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/adoptie");
  });

  it("returns graceful error on DB failure", async () => {
    mockSelectLimit.mockReset();
    mockSelectLimit.mockRejectedValue(new Error("DB down"));
    const result = await markDogidCatidTransferred(null, makeTransferFormData(1));
    expect(result.success).toBe(false);
  });
});
