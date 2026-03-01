import { describe, it, expect } from "vitest";
import {
  createCampaignSchema,
  deployCagesSchema,
  registerInspectionSchema,
  completeCampaignSchema,
  linkAnimalSchema,
} from "./stray-cat-campaigns";

describe("createCampaignSchema", () => {
  it("validates a valid campaign", () => {
    const result = createCampaignSchema.safeParse({
      requestDate: "2026-03-01",
      municipality: "Ninove",
      address: "Kerkstraat 1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing municipality", () => {
    const result = createCampaignSchema.safeParse({
      requestDate: "2026-03-01",
      municipality: "",
      address: "Kerkstraat 1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = createCampaignSchema.safeParse({
      requestDate: "01-03-2026",
      municipality: "Ninove",
      address: "Kerkstraat 1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing address", () => {
    const result = createCampaignSchema.safeParse({
      requestDate: "2026-03-01",
      municipality: "Ninove",
      address: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("deployCagesSchema", () => {
  it("validates valid cage deployment data", () => {
    const result = deployCagesSchema.safeParse({
      campaignId: 1,
      cageDeploymentDate: "2026-03-05",
      cageNumbers: "K1, K2, K3",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing cage numbers", () => {
    const result = deployCagesSchema.safeParse({
      campaignId: 1,
      cageDeploymentDate: "2026-03-05",
      cageNumbers: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerInspectionSchema", () => {
  it("validates valid inspection data", () => {
    const result = registerInspectionSchema.safeParse({
      campaignId: 1,
      inspectionDate: "2026-03-10",
      catDescription: "Cyperse kater, ~2 jaar",
      vetName: "Dr. Nadia",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional cageAtVet", () => {
    const result = registerInspectionSchema.safeParse({
      campaignId: 1,
      inspectionDate: "2026-03-10",
      catDescription: "Zwarte kat",
      vetName: "Dr. Nadia",
      cageAtVet: "K2",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cageAtVet).toBe("K2");
    }
  });
});

describe("completeCampaignSchema", () => {
  it("validates valid completion data", () => {
    const result = completeCampaignSchema.safeParse({
      campaignId: 1,
      fivStatus: "negatief",
      felvStatus: "negatief",
      outcome: "gecastreerd_uitgezet",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid fivStatus", () => {
    const result = completeCampaignSchema.safeParse({
      campaignId: 1,
      fivStatus: "onbekend",
      felvStatus: "negatief",
      outcome: "gecastreerd_uitgezet",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid outcome", () => {
    const result = completeCampaignSchema.safeParse({
      campaignId: 1,
      fivStatus: "negatief",
      felvStatus: "negatief",
      outcome: "ontsnapt",
    });
    expect(result.success).toBe(false);
  });
});

describe("linkAnimalSchema", () => {
  it("validates valid animal link", () => {
    const result = linkAnimalSchema.safeParse({
      campaignId: 1,
      linkedAnimalId: 42,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-positive animalId", () => {
    const result = linkAnimalSchema.safeParse({
      campaignId: 1,
      linkedAnimalId: 0,
    });
    expect(result.success).toBe(false);
  });
});
