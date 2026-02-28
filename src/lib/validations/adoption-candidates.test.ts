import { describe, it, expect } from "vitest";
import {
  adoptionCandidateSchema,
  questionnaireSchema,
} from "./adoption-candidates";

const validQuestionnaire = {
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
};

const validCandidate = {
  firstName: "Jan",
  lastName: "Peeters",
  email: "jan@example.com",
  phone: "0471234567",
  address: "Kerkstraat 1, 9400 Ninove",
  animalId: "1",
  questionnaireAnswers: validQuestionnaire,
  notes: "",
};

describe("questionnaireSchema", () => {
  it("validates valid questionnaire", () => {
    const result = questionnaireSchema.safeParse(validQuestionnaire);
    expect(result.success).toBe(true);
  });

  it("requires woonsituatie", () => {
    const result = questionnaireSchema.safeParse({
      ...validQuestionnaire,
      woonsituatie: "",
    });
    expect(result.success).toBe(false);
  });

  it("validates woonsituatie enum values", () => {
    const result = questionnaireSchema.safeParse({
      ...validQuestionnaire,
      woonsituatie: "kasteel",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid woonsituatie values", () => {
    for (const val of ["huis_met_tuin", "appartement", "boerderij", "andere"]) {
      const result = questionnaireSchema.safeParse({
        ...validQuestionnaire,
        woonsituatie: val,
      });
      expect(result.success).toBe(true);
    }
  });

  it("requires werkSituatie", () => {
    const result = questionnaireSchema.safeParse({
      ...validQuestionnaire,
      werkSituatie: "",
    });
    expect(result.success).toBe(false);
  });

  it("validates werkSituatie enum values", () => {
    const result = questionnaireSchema.safeParse({
      ...validQuestionnaire,
      werkSituatie: "gepensioneerd",
    });
    expect(result.success).toBe(false);
  });

  it("requires motivatie (min 1 char)", () => {
    const result = questionnaireSchema.safeParse({
      ...validQuestionnaire,
      motivatie: "",
    });
    expect(result.success).toBe(false);
  });

  it("allows tuinOmheind to be null", () => {
    const result = questionnaireSchema.safeParse({
      ...validQuestionnaire,
      tuinOmheind: null,
    });
    expect(result.success).toBe(true);
  });

  it("validates kinderenInHuis enum values", () => {
    const result = questionnaireSchema.safeParse({
      ...validQuestionnaire,
      kinderenInHuis: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid kinderenInHuis values", () => {
    for (const val of ["geen", "0_5", "6_12", "12_plus"]) {
      const result = questionnaireSchema.safeParse({
        ...validQuestionnaire,
        kinderenInHuis: val,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("adoptionCandidateSchema", () => {
  it("validates valid candidate data", () => {
    const result = adoptionCandidateSchema.safeParse(validCandidate);
    expect(result.success).toBe(true);
  });

  it("requires firstName", () => {
    const result = adoptionCandidateSchema.safeParse({
      ...validCandidate,
      firstName: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.firstName).toBeDefined();
  });

  it("requires lastName", () => {
    const result = adoptionCandidateSchema.safeParse({
      ...validCandidate,
      lastName: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.lastName).toBeDefined();
  });

  it("requires valid email", () => {
    const result = adoptionCandidateSchema.safeParse({
      ...validCandidate,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.email).toBeDefined();
  });

  it("coerces animalId to number", () => {
    const result = adoptionCandidateSchema.safeParse(validCandidate);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.animalId).toBe(1);
  });

  it("rejects invalid animalId", () => {
    const result = adoptionCandidateSchema.safeParse({
      ...validCandidate,
      animalId: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("requires questionnaireAnswers", () => {
    const result = adoptionCandidateSchema.safeParse({
      ...validCandidate,
      questionnaireAnswers: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("validates nested questionnaire", () => {
    const result = adoptionCandidateSchema.safeParse({
      ...validCandidate,
      questionnaireAnswers: { ...validQuestionnaire, woonsituatie: "" },
    });
    expect(result.success).toBe(false);
  });

  it("allows optional phone", () => {
    const result = adoptionCandidateSchema.safeParse({
      ...validCandidate,
      phone: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("allows optional address", () => {
    const result = adoptionCandidateSchema.safeParse({
      ...validCandidate,
      address: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("allows optional notes", () => {
    const result = adoptionCandidateSchema.safeParse({
      ...validCandidate,
      notes: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("enforces firstName max 100 chars", () => {
    const result = adoptionCandidateSchema.safeParse({
      ...validCandidate,
      firstName: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("enforces lastName max 100 chars", () => {
    const result = adoptionCandidateSchema.safeParse({
      ...validCandidate,
      lastName: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("enforces email max 200 chars", () => {
    const result = adoptionCandidateSchema.safeParse({
      ...validCandidate,
      email: "a".repeat(190) + "@example.com",
    });
    expect(result.success).toBe(false);
  });
});
