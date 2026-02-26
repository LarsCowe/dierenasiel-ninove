import { describe, it, expect } from "vitest";
import { animalIntakeSchema } from "./animals";

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
    for (const reason of ["afstand", "zwerfhond", "ibn", "vondeling", "overig"]) {
      const result = animalIntakeSchema.safeParse({ ...validIntake, intakeReason: reason });
      expect(result.success).toBe(true);
    }
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
});
