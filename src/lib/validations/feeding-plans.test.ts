import { describe, it, expect } from "vitest";
import { feedingPlanSchema } from "./feeding-plans";

const validQuestionnaire = {
  dieetType: "droogvoer",
  merk: "Royal Canin",
  hoeveelheid: "200g per maaltijd",
  frequentie: "2x/dag",
  allergieen: ["graan"],
  specifiekeBehoeften: "Senior hond",
};

const validPlan = {
  animalId: 1,
  questionnaire: validQuestionnaire,
};

describe("feedingPlanSchema", () => {
  it("accepts a valid plan with required fields", () => {
    const result = feedingPlanSchema.safeParse(validPlan);
    expect(result.success).toBe(true);
  });

  it("accepts a valid plan with notes", () => {
    const result = feedingPlanSchema.safeParse({
      ...validPlan,
      notes: "Extra aandacht voor gewicht",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe("Extra aandacht voor gewicht");
    }
  });

  it("coerces string animalId to number", () => {
    const result = feedingPlanSchema.safeParse({ ...validPlan, animalId: "5" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.animalId).toBe(5);
    }
  });

  it("rejects when animalId is missing", () => {
    const { animalId: _, ...without } = validPlan;
    const result = feedingPlanSchema.safeParse(without);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.animalId).toBeDefined();
    }
  });

  it("rejects when dieetType is missing", () => {
    const { dieetType: _, ...q } = validQuestionnaire;
    const result = feedingPlanSchema.safeParse({ ...validPlan, questionnaire: q });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.questionnaire).toBeDefined();
    }
  });

  it("rejects when dieetType is empty", () => {
    const result = feedingPlanSchema.safeParse({
      ...validPlan,
      questionnaire: { ...validQuestionnaire, dieetType: "" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects when hoeveelheid is missing", () => {
    const { hoeveelheid: _, ...q } = validQuestionnaire;
    const result = feedingPlanSchema.safeParse({ ...validPlan, questionnaire: q });
    expect(result.success).toBe(false);
  });

  it("rejects when hoeveelheid is empty", () => {
    const result = feedingPlanSchema.safeParse({
      ...validPlan,
      questionnaire: { ...validQuestionnaire, hoeveelheid: "" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects when frequentie is missing", () => {
    const { frequentie: _, ...q } = validQuestionnaire;
    const result = feedingPlanSchema.safeParse({ ...validPlan, questionnaire: q });
    expect(result.success).toBe(false);
  });

  it("rejects when frequentie is empty", () => {
    const result = feedingPlanSchema.safeParse({
      ...validPlan,
      questionnaire: { ...validQuestionnaire, frequentie: "" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty merk (optional content)", () => {
    const result = feedingPlanSchema.safeParse({
      ...validPlan,
      questionnaire: { ...validQuestionnaire, merk: "" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty allergieen array", () => {
    const result = feedingPlanSchema.safeParse({
      ...validPlan,
      questionnaire: { ...validQuestionnaire, allergieen: [] },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.questionnaire.allergieen).toEqual([]);
    }
  });

  it("accepts empty specifiekeBehoeften", () => {
    const result = feedingPlanSchema.safeParse({
      ...validPlan,
      questionnaire: { ...validQuestionnaire, specifiekeBehoeften: "" },
    });
    expect(result.success).toBe(true);
  });

  it("allows notes to be omitted", () => {
    const result = feedingPlanSchema.safeParse(validPlan);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeUndefined();
    }
  });

  it("rejects completely invalid questionnaire", () => {
    const result = feedingPlanSchema.safeParse({
      animalId: 1,
      questionnaire: "not an object",
    });
    expect(result.success).toBe(false);
  });
});
