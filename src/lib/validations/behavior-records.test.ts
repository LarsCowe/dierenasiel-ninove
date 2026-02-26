import { describe, it, expect } from "vitest";
import { behaviorRecordSchema } from "./behavior-records";

const validChecklist = {
  benaderingHok: 2,
  uitHetHok: 3,
  wandelingLeiband: 1,
  reactieAndereHonden: 4,
  reactieMensen: 2,
  aanrakingManipulatie: 3,
  voedselgedrag: 1,
  zindelijk: true,
  aandachtspunten: ["angst"],
};

const validRecord = {
  animalId: 1,
  date: "2026-02-26",
  checklist: validChecklist,
};

describe("behaviorRecordSchema", () => {
  it("accepts a valid record with required fields only", () => {
    const result = behaviorRecordSchema.safeParse(validRecord);
    expect(result.success).toBe(true);
  });

  it("accepts a complete record with notes", () => {
    const result = behaviorRecordSchema.safeParse({
      ...validRecord,
      notes: "Hond was erg rustig vandaag",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when animalId is missing", () => {
    const { animalId: _, ...without } = validRecord;
    const result = behaviorRecordSchema.safeParse(without);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.animalId).toBeDefined();
    }
  });

  it("coerces string animalId to number", () => {
    const result = behaviorRecordSchema.safeParse({ ...validRecord, animalId: "5" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.animalId).toBe(5);
    }
  });

  it("rejects when date is missing", () => {
    const { date: _, ...without } = validRecord;
    const result = behaviorRecordSchema.safeParse(without);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.date).toBeDefined();
    }
  });

  it("rejects when date is empty string", () => {
    const result = behaviorRecordSchema.safeParse({ ...validRecord, date: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.date).toBeDefined();
    }
  });

  it("rejects when checklist is missing", () => {
    const { checklist: _, ...without } = validRecord;
    const result = behaviorRecordSchema.safeParse(without);
    expect(result.success).toBe(false);
  });

  it("rejects score below 1", () => {
    const result = behaviorRecordSchema.safeParse({
      ...validRecord,
      checklist: { ...validChecklist, benaderingHok: 0 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects score above 5", () => {
    const result = behaviorRecordSchema.safeParse({
      ...validRecord,
      checklist: { ...validChecklist, wandelingLeiband: 6 },
    });
    expect(result.success).toBe(false);
  });

  it("accepts all scores at boundary values (1 and 5)", () => {
    const result = behaviorRecordSchema.safeParse({
      ...validRecord,
      checklist: {
        benaderingHok: 1,
        uitHetHok: 5,
        wandelingLeiband: 1,
        reactieAndereHonden: 5,
        reactieMensen: 1,
        aanrakingManipulatie: 5,
        voedselgedrag: 1,
        zindelijk: false,
        aandachtspunten: [],
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts zindelijk as null (onbekend)", () => {
    const result = behaviorRecordSchema.safeParse({
      ...validRecord,
      checklist: { ...validChecklist, zindelijk: null },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checklist.zindelijk).toBeNull();
    }
  });

  it("accepts zindelijk as boolean", () => {
    const resultTrue = behaviorRecordSchema.safeParse({
      ...validRecord,
      checklist: { ...validChecklist, zindelijk: true },
    });
    expect(resultTrue.success).toBe(true);

    const resultFalse = behaviorRecordSchema.safeParse({
      ...validRecord,
      checklist: { ...validChecklist, zindelijk: false },
    });
    expect(resultFalse.success).toBe(true);
  });

  it("accepts aandachtspunten as string array", () => {
    const result = behaviorRecordSchema.safeParse({
      ...validRecord,
      checklist: {
        ...validChecklist,
        aandachtspunten: ["angst", "agressie", "separatieangst"],
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checklist.aandachtspunten).toHaveLength(3);
    }
  });

  it("accepts empty aandachtspunten array", () => {
    const result = behaviorRecordSchema.safeParse({
      ...validRecord,
      checklist: { ...validChecklist, aandachtspunten: [] },
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-integer scores", () => {
    const result = behaviorRecordSchema.safeParse({
      ...validRecord,
      checklist: { ...validChecklist, benaderingHok: 2.5 },
    });
    expect(result.success).toBe(false);
  });

  it("allows notes to be omitted", () => {
    const result = behaviorRecordSchema.safeParse(validRecord);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeUndefined();
    }
  });
});
