import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockReturning, mockInsert,
  mockDeleteWhere, mockDelete,
  mockSelectLimit, mockSelectWhere, mockSelectFrom,
  mockRequirePermission, mockLogAudit, mockRevalidatePath, mockGetSession,
  mockGetAnimalById,
} = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockInsert = vi.fn();
  const mockDeleteWhere = vi.fn();
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockRequirePermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  const mockGetSession = vi.fn();
  const mockGetAnimalById = vi.fn();
  return {
    mockReturning, mockInsert,
    mockDeleteWhere, mockDelete,
    mockSelectLimit, mockSelectWhere, mockSelectFrom,
    mockRequirePermission, mockLogAudit, mockRevalidatePath, mockGetSession,
    mockGetAnimalById,
  };
});

vi.mock("@/lib/db", () => {
  const mockValuesChain = vi.fn().mockReturnValue({ returning: mockReturning });
  mockInsert.mockReturnValue({ values: mockValuesChain });
  return {
    db: {
      insert: mockInsert,
      delete: mockDelete,
      select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/db/schema", () => ({
  adoptionCandidates: { id: Symbol("adoptionCandidates.id"), status: Symbol("adoptionCandidates.status") },
  animals: { id: Symbol("animals.id"), isAvailableForAdoption: Symbol("animals.isAvailableForAdoption") },
}));
vi.mock("@/lib/permissions", () => ({ requirePermission: mockRequirePermission }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/queries/animals", () => ({ getAnimalById: mockGetAnimalById }));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
}));

import { createAdoptionCandidate, deleteAdoptionCandidate } from "./adoption-candidates";

const validData = {
  firstName: "Jan",
  lastName: "Peeters",
  email: "jan@example.com",
  phone: "0471234567",
  address: "Kerkstraat 1, 9400 Ninove",
  animalId: 1,
  questionnaireAnswers: {
    woonsituatie: "huis_met_tuin",
    tuinOmheind: true,
    eerderHuisdieren: true,
    huidigeHuisdieren: "1 kat",
    kinderenInHuis: "geen",
    werkSituatie: "deeltijds",
    uurAlleen: "4",
    ervaring: "Altijd honden gehad",
    motivatie: "Wil een trouwe metgezel",
    opmerkingen: "",
  },
};

const createdRecord = {
  id: 1,
  ...validData,
  category: null,
  categorySetBy: null,
  status: "pending",
  notes: null,
  createdAt: new Date(),
};

function makeFormData(json: unknown): FormData {
  const fd = new FormData();
  fd.append("json", JSON.stringify(json));
  return fd;
}

function makeDeleteFormData(id: string): FormData {
  const fd = new FormData();
  fd.append("id", id);
  return fd;
}

describe("createAdoptionCandidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ userId: 3, role: "adoptieconsulent" });
    mockGetAnimalById.mockResolvedValue({ id: 1, name: "Buddy", isAvailableForAdoption: true, isInShelter: true });
    mockReturning.mockResolvedValue([createdRecord]);
  });

  it("requires adoption:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await createAdoptionCandidate(null, makeFormData(validData));
    expect(mockRequirePermission).toHaveBeenCalledWith("adoption:write");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Onvoldoende rechten");
  });

  it("returns error when JSON is invalid", async () => {
    const fd = new FormData();
    fd.append("json", "not-valid-json{");
    const result = await createAdoptionCandidate(null, fd);
    expect(result.success).toBe(false);
  });

  it("returns fieldErrors when firstName is missing", async () => {
    const result = await createAdoptionCandidate(null, makeFormData({ ...validData, firstName: "" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors?.firstName).toBeDefined();
  });

  it("returns fieldErrors when email is invalid", async () => {
    const result = await createAdoptionCandidate(null, makeFormData({ ...validData, email: "bad" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors?.email).toBeDefined();
  });

  it("returns fieldErrors when questionnaire is invalid", async () => {
    const result = await createAdoptionCandidate(null, makeFormData({
      ...validData,
      questionnaireAnswers: { ...validData.questionnaireAnswers, woonsituatie: "" },
    }));
    expect(result.success).toBe(false);
  });

  it("returns error when animal does not exist", async () => {
    mockGetAnimalById.mockResolvedValue(null);
    const result = await createAdoptionCandidate(null, makeFormData(validData));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Dier niet gevonden");
  });

  it("returns error when animal is not available for adoption", async () => {
    mockGetAnimalById.mockResolvedValue({ id: 1, name: "Buddy", isAvailableForAdoption: false });
    const result = await createAdoptionCandidate(null, makeFormData(validData));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Dit dier is niet beschikbaar voor adoptie");
  });

  it("creates record with status pending", async () => {
    const result = await createAdoptionCandidate(null, makeFormData(validData));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("calls logAudit after success", async () => {
    await createAdoptionCandidate(null, makeFormData(validData));
    expect(mockLogAudit).toHaveBeenCalledWith(
      "create_adoption_candidate", "adoption_candidate", 1, null, expect.objectContaining({ id: 1 }),
    );
  });

  it("revalidates adoptie path", async () => {
    await createAdoptionCandidate(null, makeFormData(validData));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/adoptie");
  });

  it("returns graceful error on DB failure", async () => {
    mockReturning.mockRejectedValue(new Error("Connection refused"));
    const result = await createAdoptionCandidate(null, makeFormData(validData));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeDefined();
  });
});

describe("deleteAdoptionCandidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockSelectLimit.mockResolvedValue([createdRecord]);
    mockDeleteWhere.mockResolvedValue(undefined);
  });

  it("requires adoption:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await deleteAdoptionCandidate(null, makeDeleteFormData("1"));
    expect(result.success).toBe(false);
  });

  it("returns error when id is invalid", async () => {
    const result = await deleteAdoptionCandidate(null, makeDeleteFormData("abc"));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Ongeldig kandidaat-ID");
  });

  it("returns error when not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await deleteAdoptionCandidate(null, makeDeleteFormData("999"));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Kandidaat niet gevonden");
  });

  it("blocks deletion when status is approved", async () => {
    mockSelectLimit.mockResolvedValue([{ ...createdRecord, status: "approved" }]);
    const result = await deleteAdoptionCandidate(null, makeDeleteFormData("1"));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("niet verwijderd");
  });

  it("blocks deletion when status is adopted", async () => {
    mockSelectLimit.mockResolvedValue([{ ...createdRecord, status: "adopted" }]);
    const result = await deleteAdoptionCandidate(null, makeDeleteFormData("1"));
    expect(result.success).toBe(false);
  });

  it("allows deletion when status is pending", async () => {
    mockSelectLimit.mockResolvedValue([{ ...createdRecord, status: "pending" }]);
    const result = await deleteAdoptionCandidate(null, makeDeleteFormData("1"));
    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
  });

  it("allows deletion when status is screening", async () => {
    mockSelectLimit.mockResolvedValue([{ ...createdRecord, status: "screening" }]);
    const result = await deleteAdoptionCandidate(null, makeDeleteFormData("1"));
    expect(result.success).toBe(true);
  });

  it("calls logAudit with old value", async () => {
    await deleteAdoptionCandidate(null, makeDeleteFormData("1"));
    expect(mockLogAudit).toHaveBeenCalledWith(
      "delete_adoption_candidate", "adoption_candidate", 1, expect.objectContaining({ id: 1 }), null,
    );
  });

  it("revalidates adoptie path", async () => {
    await deleteAdoptionCandidate(null, makeDeleteFormData("1"));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/adoptie");
  });

  it("returns graceful error on DB failure", async () => {
    mockDeleteWhere.mockRejectedValue(new Error("Connection refused"));
    const result = await deleteAdoptionCandidate(null, makeDeleteFormData("1"));
    expect(result.success).toBe(false);
  });
});
