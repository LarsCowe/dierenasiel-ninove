import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mocks
const { mockReturning, mockValues, mockInsert, mockRequirePermission, mockLogAudit } = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
  const mockRequirePermission = vi.fn();
  const mockLogAudit = vi.fn();
  return { mockReturning, mockValues, mockInsert, mockRequirePermission, mockLogAudit };
});

vi.mock("@/lib/db", () => ({
  db: { insert: mockInsert },
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

import { createAnimalIntake } from "./animals";
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
});
