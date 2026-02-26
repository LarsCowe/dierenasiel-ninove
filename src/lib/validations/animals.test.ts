import { describe, it, expect } from "vitest";
import { animalIntakeSchema, animalUpdateSchema } from "./animals";

const validIntake = {
  name: "Rex",
  species: "hond" as const,
  gender: "reu",
  intakeDate: "2026-02-26",
};

describe("animalIntakeSchema", () => {
  it("accepts a valid intake form with required fields only", () => {
    const result = animalIntakeSchema.safeParse(validIntake);
    expect(result.success).toBe(true);
  });

  it("accepts a complete intake form with all optional fields", () => {
    const result = animalIntakeSchema.safeParse({
      ...validIntake,
      breed: "Mechelse Herder",
      color: "bruin",
      dateOfBirth: "2022-05-02",
      identificationNr: "981100004567890",
      passportNr: "BE-123456",
      intakeDate: "2026-02-26",
      intakeReason: "afstand",
      description: "Een lieve hond",
      shortDescription: "Lief",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when naam is missing", () => {
    const result = animalIntakeSchema.safeParse({ species: "hond", gender: "reu" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.name).toBeDefined();
    }
  });

  it("rejects when naam is empty string", () => {
    const result = animalIntakeSchema.safeParse({ ...validIntake, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects when soort is missing", () => {
    const result = animalIntakeSchema.safeParse({ name: "Rex", gender: "reu" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.species).toBeDefined();
    }
  });

  it("rejects an invalid soort value", () => {
    const result = animalIntakeSchema.safeParse({ ...validIntake, species: "vis" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.species).toBeDefined();
    }
  });

  it("rejects when geslacht is missing", () => {
    const result = animalIntakeSchema.safeParse({ name: "Rex", species: "hond" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.gender).toBeDefined();
    }
  });

  it("rejects when geslacht is empty string", () => {
    const result = animalIntakeSchema.safeParse({ ...validIntake, gender: "" });
    expect(result.success).toBe(false);
  });

  it("allows all optional fields to be omitted", () => {
    const result = animalIntakeSchema.safeParse(validIntake);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.breed).toBeUndefined();
      expect(result.data.color).toBeUndefined();
      expect(result.data.isPickedUpByShelter).toBe(false);
    }
  });

  it("accepts valid intake reasons", () => {
    for (const reason of ["afstand", "zwerfhond", "vondeling", "overig"]) {
      const result = animalIntakeSchema.safeParse({ ...validIntake, intakeReason: reason });
      expect(result.success).toBe(true);
    }
    // IBN requires extra fields
    const ibnResult = animalIntakeSchema.safeParse({
      ...validIntake,
      intakeReason: "ibn",
      dossierNr: "DWV-2026-12345",
      pvNr: "PV-2026-001",
    });
    expect(ibnResult.success).toBe(true);
  });

  it("rejects an invalid intake reason", () => {
    const result = animalIntakeSchema.safeParse({ ...validIntake, intakeReason: "ongeldig" });
    expect(result.success).toBe(false);
  });

  it("accepts intake_metadata for shelter pickup", () => {
    const result = animalIntakeSchema.safeParse({
      ...validIntake,
      isPickedUpByShelter: true,
      intakeMetadata: {
        melderNaam: "Jan Janssens",
        melderLocatie: "Brusselsesteenweg 123, Ninove",
        melderDatum: "2026-02-25",
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.intakeMetadata?.melderNaam).toBe("Jan Janssens");
    }
  });

  it("rejects when intakeDate is missing", () => {
    const { intakeDate: _, ...withoutDate } = validIntake;
    const result = animalIntakeSchema.safeParse(withoutDate);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.intakeDate).toBeDefined();
    }
  });

  it("rejects when intakeDate is empty string", () => {
    const result = animalIntakeSchema.safeParse({ ...validIntake, intakeDate: "" });
    expect(result.success).toBe(false);
  });

  it("accepts empty intake_metadata", () => {
    const result = animalIntakeSchema.safeParse({
      ...validIntake,
      isPickedUpByShelter: false,
    });
    expect(result.success).toBe(true);
  });

  // IBN-specific validation
  it("requires dossierNr when intakeReason is ibn", () => {
    const result = animalIntakeSchema.safeParse({
      ...validIntake,
      intakeReason: "ibn",
      pvNr: "PV-2026-001",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.dossierNr).toBeDefined();
    }
  });

  it("requires pvNr when intakeReason is ibn", () => {
    const result = animalIntakeSchema.safeParse({
      ...validIntake,
      intakeReason: "ibn",
      dossierNr: "DWV-2026-12345",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.pvNr).toBeDefined();
    }
  });

  it("accepts valid IBN intake with all required fields", () => {
    const result = animalIntakeSchema.safeParse({
      ...validIntake,
      intakeReason: "ibn",
      dossierNr: "DWV-2026-12345",
      pvNr: "PV-2026-001",
    });
    expect(result.success).toBe(true);
  });

  it("does not require dossierNr/pvNr for non-IBN intake", () => {
    const result = animalIntakeSchema.safeParse({
      ...validIntake,
      intakeReason: "afstand",
    });
    expect(result.success).toBe(true);
  });

  it("does not require dossierNr/pvNr when intakeReason is omitted", () => {
    const result = animalIntakeSchema.safeParse(validIntake);
    expect(result.success).toBe(true);
  });

  it("accepts IBN intake with betrokken instanties metadata", () => {
    const result = animalIntakeSchema.safeParse({
      ...validIntake,
      intakeReason: "ibn",
      dossierNr: "DWV-2026-12345",
      pvNr: "PV-2026-001",
      isPickedUpByShelter: true,
      intakeMetadata: {
        melderNaam: "Politie Ninove",
        melderLocatie: "Centrumlaan 100",
        melderDatum: "2026-02-20",
        betrokkenInstanties: "Politiezone Ninove, Dierenwelzijn Vlaanderen",
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.intakeMetadata?.betrokkenInstanties).toBe(
        "Politiezone Ninove, Dierenwelzijn Vlaanderen",
      );
    }
  });

  it("rejects IBN intake when both dossierNr and pvNr are empty strings", () => {
    const result = animalIntakeSchema.safeParse({
      ...validIntake,
      intakeReason: "ibn",
      dossierNr: "",
      pvNr: "",
    });
    expect(result.success).toBe(false);
  });
});

const validUpdate = {
  id: 1,
  name: "Rex",
};

describe("animalUpdateSchema", () => {
  it("accepts a valid update with all fields", () => {
    const result = animalUpdateSchema.safeParse({
      id: 1,
      name: "Rex",
      aliasName: "Buddy",
      breed: "Mechelse Herder",
      color: "bruin",
      dateOfBirth: "2022-05-02",
      description: "Een lieve hond",
      shortDescription: "Lief",
      identificationNr: "981100004567890",
      passportNr: "BE-123456",
      barcode: "ABC123",
      isOnWebsite: true,
      isFeatured: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts update with only required fields (id, name)", () => {
    const result = animalUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it("rejects when id is missing", () => {
    const result = animalUpdateSchema.safeParse({ name: "Rex" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.id).toBeDefined();
    }
  });

  it("rejects when name is empty", () => {
    const result = animalUpdateSchema.safeParse({ id: 1, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.name).toBeDefined();
    }
  });

  it("coerces string id to number", () => {
    const result = animalUpdateSchema.safeParse({ id: "5", name: "Rex" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(5);
    }
  });

  it("accepts boolean toggles isOnWebsite and isFeatured", () => {
    const result = animalUpdateSchema.safeParse({
      ...validUpdate,
      isOnWebsite: true,
      isFeatured: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isOnWebsite).toBe(true);
      expect(result.data.isFeatured).toBe(true);
    }
  });

  it("defaults isOnWebsite and isFeatured to false when omitted", () => {
    const result = animalUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isOnWebsite).toBe(false);
      expect(result.data.isFeatured).toBe(false);
    }
  });

  it("accepts optional aliasName (schuilnaam)", () => {
    const result = animalUpdateSchema.safeParse({
      ...validUpdate,
      aliasName: "Buddy",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aliasName).toBe("Buddy");
    }
  });

  it("accepts all optional fields as undefined", () => {
    const result = animalUpdateSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.breed).toBeUndefined();
      expect(result.data.color).toBeUndefined();
      expect(result.data.aliasName).toBeUndefined();
      expect(result.data.description).toBeUndefined();
    }
  });
});
