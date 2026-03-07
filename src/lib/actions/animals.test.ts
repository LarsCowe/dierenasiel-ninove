import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mocks
const {
  mockReturning, mockValues, mockInsert,
  mockUpdateReturning, mockUpdateWhere, mockUpdateSet, mockUpdate,
  mockSelectReturning, mockSelectWhere, mockSelectLimit,
  mockRequirePermission, mockLogAudit, mockRevalidatePath,
} = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

  const mockUpdateReturning = vi.fn();
  const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning });
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectReturning = vi.fn().mockReturnValue({ where: mockSelectWhere });

  const mockRequirePermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();
  return {
    mockReturning, mockValues, mockInsert,
    mockUpdateReturning, mockUpdateWhere, mockUpdateSet, mockUpdate,
    mockSelectReturning, mockSelectWhere, mockSelectLimit,
    mockRequirePermission, mockLogAudit, mockRevalidatePath,
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    insert: mockInsert,
    update: mockUpdate,
    select: vi.fn().mockReturnValue({ from: mockSelectReturning }),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@/lib/db/schema", () => ({
  animals: Symbol("animals"),
}));

vi.mock("@/lib/permissions", () => ({
  requirePermission: mockRequirePermission,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

import { createAnimalIntake, updateAnimal } from "./animals";
import { animals } from "@/lib/db/schema";

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    fd.append(key, value);
  }
  return fd;
}

const validFormData = {
  name: "Rex",
  species: "hond",
  gender: "reu",
  breed: "Mechelse Herder",
  color: "bruin",
  intakeDate: "2026-02-26",
  intakeReason: "afstand",
};

describe("createAnimalIntake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockReturning.mockResolvedValue([{
      id: 1,
      name: "Rex",
      slug: "rex",
      species: "hond",
      gender: "reu",
      status: "beschikbaar",
      isInShelter: true,
    }]);
    // Auto-barcode update for dogs
    mockUpdateReturning.mockResolvedValue([{
      id: 1,
      name: "Rex",
      slug: "rex",
      species: "hond",
      gender: "reu",
      status: "beschikbaar",
      isInShelter: true,
      barcode: "DOG-1",
    }]);
  });

  it("requires animal:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });

    const result = await createAnimalIntake(null, makeFormData(validFormData));

    expect(mockRequirePermission).toHaveBeenCalledWith("animal:write");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Onvoldoende rechten");
    }
  });

  it("returns fieldErrors when validation fails", async () => {
    const result = await createAnimalIntake(null, makeFormData({ name: "", species: "hond", gender: "" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors!.name).toBeDefined();
      expect(result.fieldErrors!.gender).toBeDefined();
    }
  });

  it("creates animal with correct defaults (status=beschikbaar, isInShelter=true)", async () => {
    await createAnimalIntake(null, makeFormData(validFormData));

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "beschikbaar",
        isInShelter: true,
      }),
    );
  });

  it("generates slug from name", async () => {
    await createAnimalIntake(null, makeFormData(validFormData));

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "rex",
      }),
    );
  });

  it("passes all form fields to db.insert", async () => {
    await createAnimalIntake(null, makeFormData(validFormData));

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Rex",
        species: "hond",
        gender: "reu",
        breed: "Mechelse Herder",
        color: "bruin",
        intakeDate: "2026-02-26",
        intakeReason: "afstand",
      }),
    );
  });

  it("inserts into animals table", async () => {
    await createAnimalIntake(null, makeFormData(validFormData));

    expect(mockInsert).toHaveBeenCalledWith(animals);
  });

  it("calls logAudit after successful creation", async () => {
    const result = await createAnimalIntake(null, makeFormData(validFormData));

    expect(result.success).toBe(true);
    expect(mockLogAudit).toHaveBeenCalledWith(
      "create_animal",
      "animal",
      1,
      null,
      expect.objectContaining({ id: 1, name: "Rex" }),
    );
  });

  it("returns success with created animal data", async () => {
    const result = await createAnimalIntake(null, makeFormData(validFormData));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(expect.objectContaining({
        id: 1,
        name: "Rex",
        slug: "rex",
      }));
    }
  });

  it("stores intake_metadata for shelter pickup", async () => {
    const fd = makeFormData({
      ...validFormData,
      isPickedUpByShelter: "true",
      "intakeMetadata.melderNaam": "Jan Janssens",
      "intakeMetadata.melderLocatie": "Brusselsesteenweg 123",
      "intakeMetadata.melderDatum": "2026-02-25",
    });

    await createAnimalIntake(null, fd);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        isPickedUpByShelter: true,
        intakeMetadata: {
          melderNaam: "Jan Janssens",
          melderLocatie: "Brusselsesteenweg 123",
          melderDatum: "2026-02-25",
        },
      }),
    );
  });

  it("returns field error on duplicate slug (unique constraint)", async () => {
    mockReturning.mockRejectedValue(Object.assign(new Error("unique violation"), { code: "23505" }));

    const result = await createAnimalIntake(null, makeFormData(validFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.name).toBeDefined();
    }
  });

  it("returns graceful error on DB failure", async () => {
    mockReturning.mockRejectedValue(new Error("Connection refused"));

    const result = await createAnimalIntake(null, makeFormData(validFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  // IBN intake tests
  it("calculates ibnDecisionDeadline = intakeDate + 60 days for IBN intake", async () => {
    const fd = makeFormData({
      ...validFormData,
      intakeReason: "ibn",
      dossierNr: "DWV-2026-12345",
      pvNr: "PV-2026-001",
      intakeDate: "2026-02-26",
    });

    await createAnimalIntake(null, fd);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        dossierNr: "DWV-2026-12345",
        pvNr: "PV-2026-001",
        ibnDecisionDeadline: "2026-04-27",
      }),
    );
  });

  it("does not set ibnDecisionDeadline for non-IBN intake", async () => {
    await createAnimalIntake(null, makeFormData(validFormData));

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        dossierNr: null,
        pvNr: null,
        ibnDecisionDeadline: null,
      }),
    );
  });

  it("returns validation error when IBN intake missing dossierNr", async () => {
    const fd = makeFormData({
      ...validFormData,
      intakeReason: "ibn",
      pvNr: "PV-2026-001",
    });

    const result = await createAnimalIntake(null, fd);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.dossierNr).toBeDefined();
    }
  });

  it("stores betrokkenInstanties in intakeMetadata for IBN", async () => {
    const fd = makeFormData({
      ...validFormData,
      intakeReason: "ibn",
      dossierNr: "DWV-2026-12345",
      pvNr: "PV-2026-001",
      isPickedUpByShelter: "true",
      "intakeMetadata.melderNaam": "Politie Ninove",
      "intakeMetadata.betrokkenInstanties": "Politiezone Ninove, Dierenwelzijn Vlaanderen",
    });

    await createAnimalIntake(null, fd);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        intakeMetadata: expect.objectContaining({
          betrokkenInstanties: "Politiezone Ninove, Dierenwelzijn Vlaanderen",
        }),
      }),
    );
  });
});

const existingAnimal = {
  id: 1,
  name: "Rex",
  slug: "rex",
  aliasName: null,
  species: "hond",
  gender: "reu",
  breed: "Mechelse Herder",
  color: "bruin",
  status: "beschikbaar",
  isOnWebsite: false,
  isFeatured: false,
};

const updateFormData = {
  id: "1",
  name: "Rex Updated",
  gender: "mannelijk",
  breed: "Border Collie",
  color: "zwart-wit",
  isOnWebsite: "true",
  isFeatured: "false",
};

describe("updateAnimal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockSelectLimit.mockResolvedValue([existingAnimal]);
    mockUpdateReturning.mockResolvedValue([{
      ...existingAnimal,
      name: "Rex Updated",
      slug: "rex-updated",
      breed: "Border Collie",
      color: "zwart-wit",
      isOnWebsite: true,
      updatedAt: new Date(),
    }]);
  });

  it("requires animal:write permission", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });

    const result = await updateAnimal(null, makeFormData(updateFormData));

    expect(mockRequirePermission).toHaveBeenCalledWith("animal:write");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Onvoldoende rechten");
    }
  });

  it("returns validation error when data is invalid", async () => {
    const result = await updateAnimal(null, makeFormData({ id: "1", name: "" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors!.name).toBeDefined();
    }
  });

  it("saves changes and returns updated animal", async () => {
    const result = await updateAnimal(null, makeFormData(updateFormData));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Rex Updated");
    }
  });

  it("updates slug when name changes", async () => {
    await updateAnimal(null, makeFormData(updateFormData));

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "rex-updated",
      }),
    );
  });

  it("logs audit with oldValue and newValue", async () => {
    await updateAnimal(null, makeFormData(updateFormData));

    expect(mockLogAudit).toHaveBeenCalledWith(
      "update_animal",
      "animal",
      1,
      existingAnimal,
      expect.objectContaining({ name: "Rex Updated" }),
    );
  });

  it("sets updatedAt to current timestamp", async () => {
    await updateAnimal(null, makeFormData(updateFormData));

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        updatedAt: expect.any(Date),
      }),
    );
  });

  it("returns error when animal not found", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await updateAnimal(null, makeFormData(updateFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Dier niet gevonden");
    }
  });

  it("returns field error on duplicate name (unique constraint 23505)", async () => {
    mockUpdateReturning.mockRejectedValue(
      Object.assign(new Error("unique violation"), { code: "23505" }),
    );

    const result = await updateAnimal(null, makeFormData(updateFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.name).toBeDefined();
    }
  });

  it("returns graceful error on unexpected DB error", async () => {
    mockUpdateReturning.mockRejectedValue(new Error("Connection refused"));

    const result = await updateAnimal(null, makeFormData(updateFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it("saves aliasName (schuilnaam) when provided", async () => {
    await updateAnimal(null, makeFormData({
      ...updateFormData,
      aliasName: "Buddy",
    }));

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        aliasName: "Buddy",
      }),
    );
  });

  it("revalidates the dieren path after update", async () => {
    await updateAnimal(null, makeFormData(updateFormData));

    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren");
  });
});
