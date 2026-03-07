import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockReturning, mockInsert,
  mockDeleteWhere, mockDelete,
  mockSelectLimit, mockSelectWhere, mockSelectFrom,
  mockUpdateSetWhere, mockUpdateSet, mockUpdate,
  mockRequirePermission, mockLogAudit, mockRevalidatePath, mockGetSession,
  mockGetAnimalById,
  mockCheckBlacklistMatch,
} = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockInsert = vi.fn();
  const mockDeleteWhere = vi.fn();
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });
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
  const mockCheckBlacklistMatch = vi.fn();
  return {
    mockReturning, mockInsert,
    mockDeleteWhere, mockDelete,
    mockSelectLimit, mockSelectWhere, mockSelectFrom,
    mockUpdateSetWhere, mockUpdateSet, mockUpdate,
    mockRequirePermission, mockLogAudit, mockRevalidatePath, mockGetSession,
    mockGetAnimalById,
    mockCheckBlacklistMatch,
  };
});

vi.mock("@/lib/db", () => {
  const mockValuesChain = vi.fn().mockReturnValue({ returning: mockReturning });
  mockInsert.mockReturnValue({ values: mockValuesChain });
  return {
    db: {
      insert: mockInsert,
      delete: mockDelete,
      update: mockUpdate,
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
vi.mock("@/lib/queries/blacklist", () => ({ checkBlacklistMatch: mockCheckBlacklistMatch }));
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
  and: vi.fn((...args: unknown[]) => ({ type: "and", args })),
}));

import {
  createAdoptionCandidate,
  deleteAdoptionCandidate,
  setCategoryAdoptionCandidate,
  updateStatusAdoptionCandidate,
} from "./adoption-candidates";

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
    mockCheckBlacklistMatch.mockResolvedValue(null);
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

  it("checks blacklist after creating candidate", async () => {
    mockCheckBlacklistMatch.mockResolvedValue(null);
    await createAdoptionCandidate(null, makeFormData(validData));
    expect(mockCheckBlacklistMatch).toHaveBeenCalledWith("Jan", "Peeters", "Kerkstraat 1, 9400 Ninove");
  });

  it("sets blacklistMatch on candidate when match found", async () => {
    const blacklistEntry = { id: 5, firstName: "Jan", lastName: "Peeters", isActive: true };
    mockCheckBlacklistMatch.mockResolvedValue(blacklistEntry);
    const result = await createAdoptionCandidate(null, makeFormData(validData));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ blacklistMatch: true, blacklistMatchEntryId: 5 }),
    );
  });

  it("does not update blacklist fields when no match", async () => {
    mockCheckBlacklistMatch.mockResolvedValue(null);
    await createAdoptionCandidate(null, makeFormData(validData));
    expect(mockUpdateSet).not.toHaveBeenCalledWith(
      expect.objectContaining({ blacklistMatch: true }),
    );
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

function makeCategoryFormData(id: string, category: string): FormData {
  const fd = new FormData();
  fd.append("json", JSON.stringify({ id: Number(id), category }));
  return fd;
}

function makeStatusFormData(id: string, status: string): FormData {
  const fd = new FormData();
  fd.append("json", JSON.stringify({ id: Number(id), status }));
  return fd;
}

describe("setCategoryAdoptionCandidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ userId: 3, role: "adoptieconsulent", name: "Marie Janssens" });
    mockSelectLimit.mockResolvedValue([{ ...createdRecord, status: "screening" }]);
    mockUpdateSetWhere.mockResolvedValue(undefined);
  });

  it("requires adoption:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await setCategoryAdoptionCandidate(null, makeCategoryFormData("1", "goede_kandidaat"));
    expect(mockRequirePermission).toHaveBeenCalledWith("adoption:write");
    expect(result.success).toBe(false);
  });

  it("returns error when JSON is invalid", async () => {
    const fd = new FormData();
    fd.append("json", "not-valid");
    const result = await setCategoryAdoptionCandidate(null, fd);
    expect(result.success).toBe(false);
  });

  it("rejects invalid category value", async () => {
    const result = await setCategoryAdoptionCandidate(null, makeCategoryFormData("1", "excellent"));
    expect(result.success).toBe(false);
  });

  it("returns error when candidate not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await setCategoryAdoptionCandidate(null, makeCategoryFormData("999", "goede_kandidaat"));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Kandidaat niet gevonden");
  });

  it("sets category and categorySetBy on success", async () => {
    const result = await setCategoryAdoptionCandidate(null, makeCategoryFormData("1", "goede_kandidaat"));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ category: "goede_kandidaat", categorySetBy: "Marie Janssens" }),
    );
  });

  it("also sets status to screening if currently pending", async () => {
    mockSelectLimit.mockResolvedValue([{ ...createdRecord, status: "pending" }]);
    const result = await setCategoryAdoptionCandidate(null, makeCategoryFormData("1", "mogelijks"));
    expect(result.success).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ category: "mogelijks", status: "screening" }),
    );
  });

  it("does not change status if already screening or later", async () => {
    mockSelectLimit.mockResolvedValue([{ ...createdRecord, status: "screening" }]);
    const result = await setCategoryAdoptionCandidate(null, makeCategoryFormData("1", "mogelijks"));
    expect(result.success).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.not.objectContaining({ status: expect.anything() }),
    );
  });

  it("calls logAudit after success", async () => {
    await setCategoryAdoptionCandidate(null, makeCategoryFormData("1", "goede_kandidaat"));
    expect(mockLogAudit).toHaveBeenCalledWith(
      "set_category_adoption_candidate", "adoption_candidate", 1,
      expect.objectContaining({ category: null }),
      expect.objectContaining({ category: "goede_kandidaat" }),
    );
  });

  it("revalidates adoptie path", async () => {
    await setCategoryAdoptionCandidate(null, makeCategoryFormData("1", "goede_kandidaat"));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/adoptie");
  });

  it("returns graceful error on DB failure", async () => {
    mockUpdateSetWhere.mockRejectedValue(new Error("Connection refused"));
    const result = await setCategoryAdoptionCandidate(null, makeCategoryFormData("1", "goede_kandidaat"));
    expect(result.success).toBe(false);
  });
});

describe("updateStatusAdoptionCandidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockSelectLimit.mockResolvedValue([{ ...createdRecord, status: "screening" }]);
    mockUpdateSetWhere.mockResolvedValue(undefined);
  });

  it("requires adoption:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const result = await updateStatusAdoptionCandidate(null, makeStatusFormData("1", "rejected"));
    expect(mockRequirePermission).toHaveBeenCalledWith("adoption:write");
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", async () => {
    const result = await updateStatusAdoptionCandidate(null, makeStatusFormData("1", "cancelled"));
    expect(result.success).toBe(false);
  });

  it("returns error when candidate not found", async () => {
    mockSelectLimit.mockResolvedValue([]);
    const result = await updateStatusAdoptionCandidate(null, makeStatusFormData("999", "rejected"));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Kandidaat niet gevonden");
  });

  it("updates status on success", async () => {
    const result = await updateStatusAdoptionCandidate(null, makeStatusFormData("1", "rejected"));
    expect(result.success).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ status: "rejected" }));
  });

  it("calls logAudit after success", async () => {
    await updateStatusAdoptionCandidate(null, makeStatusFormData("1", "approved"));
    expect(mockLogAudit).toHaveBeenCalledWith(
      "update_status_adoption_candidate", "adoption_candidate", 1,
      expect.objectContaining({ status: "screening" }),
      expect.objectContaining({ status: "approved" }),
    );
  });

  it("revalidates adoptie path", async () => {
    await updateStatusAdoptionCandidate(null, makeStatusFormData("1", "rejected"));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/adoptie");
  });

  it("returns graceful error on DB failure", async () => {
    mockUpdateSetWhere.mockRejectedValue(new Error("Connection refused"));
    const result = await updateStatusAdoptionCandidate(null, makeStatusFormData("1", "rejected"));
    expect(result.success).toBe(false);
  });
});
