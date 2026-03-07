import { describe, it, expect } from "vitest";
import { behaviorRecordSchema } from "./behavior-records";

const validChecklist = {
  verzorgers_algemeenAgressief: false,
  verzorgers_agressiefSpeelgoed: false,
  verzorgers_agressiefVoederkom: null,
  verzorgers_agressiefMand: false,
  verzorgers_gemakkelijkWandeling: true,
  verzorgers_speeltGraag: true,
  verzorgers_andere: null,
  honden_algemeenAgressief: true,
  honden_agressiefSpeelgoed: false,
  honden_agressiefVoederkom: null,
  honden_agressiefMand: false,
  honden_speeltGraag: false,
  honden_andere: null,
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

  it("accepts all boolean values (true, false, null)", () => {
    const result = behaviorRecordSchema.safeParse({
      ...validRecord,
      checklist: {
        verzorgers_algemeenAgressief: true,
        verzorgers_agressiefSpeelgoed: false,
        verzorgers_agressiefVoederkom: null,
        verzorgers_agressiefMand: true,
        verzorgers_gemakkelijkWandeling: false,
        verzorgers_speeltGraag: null,
        verzorgers_andere: null,
        honden_algemeenAgressief: true,
        honden_agressiefSpeelgoed: false,
        honden_agressiefVoederkom: null,
        honden_agressiefMand: true,
        honden_speeltGraag: false,
        honden_andere: null,
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts andere as string", () => {
    const result = behaviorRecordSchema.safeParse({
      ...validRecord,
      checklist: {
        ...validChecklist,
        verzorgers_andere: "Blaft veel bij onweer",
        honden_andere: "Reageert op grote honden",
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checklist.verzorgers_andere).toBe("Blaft veel bij onweer");
      expect(result.data.checklist.honden_andere).toBe("Reageert op grote honden");
    }
  });

  it("accepts andere as null", () => {
    const result = behaviorRecordSchema.safeParse({
      ...validRecord,
      checklist: { ...validChecklist, verzorgers_andere: null, honden_andere: null },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checklist.verzorgers_andere).toBeNull();
    }
  });

  it("allows notes to be omitted", () => {
    const result = behaviorRecordSchema.safeParse(validRecord);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeUndefined();
    }
  });
});
