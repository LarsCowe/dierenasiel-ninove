import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockRequirePermission,
  mockLogAudit,
  mockRevalidatePath,
  mockSelectLimit,
  mockSelectWhere,
  mockSelectFrom,
  mockUpdateReturning,
  mockUpdateWhere,
  mockUpdateSet,
  mockUpdate,
} = vi.hoisted(() => {
  const mockRequirePermission = vi.fn();
  const mockLogAudit = vi.fn();
  const mockRevalidatePath = vi.fn();

  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });

  const mockUpdateReturning = vi.fn();
  const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning });
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

  return {
    mockRequirePermission,
    mockLogAudit,
    mockRevalidatePath,
    mockSelectLimit,
    mockSelectWhere,
    mockSelectFrom,
    mockUpdateReturning,
    mockUpdateWhere,
    mockUpdateSet,
    mockUpdate,
  };
});

vi.mock("@/lib/permissions", () => ({
  requirePermission: mockRequirePermission,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({ from: mockSelectFrom }),
    update: mockUpdate,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  animals: Symbol("animals"),
  vaccinations: {
    id: Symbol("vaccinations.id"),
    animalId: Symbol("vaccinations.animalId"),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => ({ type: "eq", args })),
}));

import { changeStatus, registerOuttake } from "./animals-status";

const mockAnimal = {
  id: 1,
  name: "Rex",
  species: "hond",
  status: "beschikbaar",
  isInShelter: true,
  kennelId: 5,
  identificationNr: "981000123456789",
  isNeutered: true,
  outtakeDate: null,
  outtakeReason: null,
};

describe("changeStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockSelectLimit.mockResolvedValue([mockAnimal]);
    mockUpdateReturning.mockResolvedValue([{ ...mockAnimal, status: "in_behandeling" }]);
  });

  it("requires animal:write permission", async () => {
    mockRequirePermission.mockResolvedValue({
      success: false,
      error: "Onvoldoende rechten",
    });

    const result = await changeStatus(1, "in_behandeling");

    expect(mockRequirePermission).toHaveBeenCalledWith("animal:write");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Onvoldoende rechten");
  });

  it("returns error for invalid status", async () => {
    const result = await changeStatus(1, "onbekend" as never);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Ongeldige");
  });

  it("blocks terminal statuses (must use outtake flow)", async () => {
    for (const status of ["geadopteerd", "terug_eigenaar", "geeuthanaseerd"]) {
      const result = await changeStatus(1, status);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error).toContain("uitstroomregistratie");
    }
  });

  it("returns error when animal not found", async () => {
    mockSelectLimit.mockResolvedValueOnce([]);

    const result = await changeStatus(999, "in_behandeling");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("niet gevonden");
  });

  it("updates status and logs audit", async () => {
    const result = await changeStatus(1, "in_behandeling");

    expect(result.success).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "in_behandeling" }),
    );
    expect(mockLogAudit).toHaveBeenCalledWith(
      "change_status",
      "animal",
      1,
      expect.objectContaining({ status: "beschikbaar" }),
      expect.objectContaining({ status: "in_behandeling" }),
    );
  });

  it("revalidates paths after status change", async () => {
    await changeStatus(1, "gereserveerd");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren/1");
  });

  it("returns error on database failure", async () => {
    mockUpdateReturning.mockRejectedValueOnce(new Error("DB error"));

    const result = await changeStatus(1, "in_behandeling");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("mis");
  });
});

describe("registerOuttake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockResolvedValue(undefined);
    mockLogAudit.mockResolvedValue(undefined);
    mockSelectLimit.mockResolvedValue([mockAnimal]);
    mockUpdateReturning.mockResolvedValue([{
      ...mockAnimal,
      status: "geadopteerd",
      isInShelter: false,
      outtakeDate: "2026-02-26",
      outtakeReason: "adoptie",
      kennelId: null,
    }]);
  });

  it("requires animal:write permission", async () => {
    mockRequirePermission.mockResolvedValue({
      success: false,
      error: "Onvoldoende rechten",
    });

    const result = await registerOuttake(1, "adoptie", "2026-02-26");

    expect(result.success).toBe(false);
  });

  it("returns error for invalid outtake reason", async () => {
    const result = await registerOuttake(1, "weggelopen" as never, "2026-02-26");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Ongeldige");
  });

  it("returns error when animal not found", async () => {
    mockSelectLimit.mockResolvedValueOnce([]);

    const result = await registerOuttake(999, "adoptie", "2026-02-26");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("niet gevonden");
  });

  it("registers outtake with correct fields", async () => {
    const result = await registerOuttake(1, "adoptie", "2026-02-26");

    expect(result.success).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "geadopteerd",
        isInShelter: false,
        outtakeDate: "2026-02-26",
        outtakeReason: "adoptie",
        kennelId: null,
      }),
    );
  });

  it("maps terug_eigenaar reason to terug_eigenaar status", async () => {
    mockUpdateReturning.mockResolvedValue([{
      ...mockAnimal,
      status: "terug_eigenaar",
      outtakeReason: "terug_eigenaar",
    }]);

    const result = await registerOuttake(1, "terug_eigenaar", "2026-02-26");

    expect(result.success).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "terug_eigenaar" }),
    );
  });

  it("maps euthanasie reason to geeuthanaseerd status", async () => {
    mockUpdateReturning.mockResolvedValue([{
      ...mockAnimal,
      status: "geeuthanaseerd",
      outtakeReason: "euthanasie",
    }]);

    const result = await registerOuttake(1, "euthanasie", "2026-02-26");

    expect(result.success).toBe(true);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "geeuthanaseerd" }),
    );
  });

  it("returns guard warnings for cat outtake (adoptie) when not chipped", async () => {
    mockSelectLimit
      .mockResolvedValueOnce([{
        ...mockAnimal,
        species: "kat",
        identificationNr: null,
        isNeutered: true,
      }])
      .mockResolvedValueOnce([{ id: 10 }]); // has vaccinations

    const result = await registerOuttake(1, "adoptie", "2026-02-26");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.guardWarnings).toBeDefined();
      expect(result.guardWarnings!.some((w: { code: string }) => w.code === "cat_chip_missing")).toBe(true);
    }
  });

  it("returns guard warnings for cat outtake (terug_eigenaar) when not sterilized", async () => {
    mockSelectLimit
      .mockResolvedValueOnce([{
        ...mockAnimal,
        species: "kat",
        identificationNr: "981000123456789",
        isNeutered: false,
      }])
      .mockResolvedValueOnce([{ id: 10 }]); // has vaccinations

    const result = await registerOuttake(1, "terug_eigenaar", "2026-02-26");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.guardWarnings).toBeDefined();
      expect(result.guardWarnings!.some((w: { code: string }) => w.code === "cat_neutering_missing")).toBe(true);
    }
  });

  it("returns guard warnings for cat with chip, sterilization, and vaccination missing", async () => {
    mockSelectLimit
      .mockResolvedValueOnce([{
        ...mockAnimal,
        species: "kat",
        identificationNr: null,
        isNeutered: false,
      }])
      .mockResolvedValueOnce([]); // no vaccinations

    const result = await registerOuttake(1, "adoptie", "2026-02-26");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.guardWarnings).toHaveLength(3);
      const codes = result.guardWarnings!.map((w: { code: string }) => w.code);
      expect(codes).toContain("cat_chip_missing");
      expect(codes).toContain("cat_vaccination_missing");
      expect(codes).toContain("cat_neutering_missing");
    }
  });

  it("allows cat euthanasie without chip/sterilization check", async () => {
    mockSelectLimit.mockResolvedValueOnce([{
      ...mockAnimal,
      species: "kat",
      identificationNr: null,
      isNeutered: false,
    }]);

    const result = await registerOuttake(1, "euthanasie", "2026-02-26");

    expect(result.success).toBe(true);
  });

  it("allows dog outtake without chip/sterilization check", async () => {
    mockSelectLimit.mockResolvedValueOnce([{
      ...mockAnimal,
      species: "hond",
      identificationNr: null,
      isNeutered: false,
    }]);

    const result = await registerOuttake(1, "adoptie", "2026-02-26");

    expect(result.success).toBe(true);
  });

  it("logs audit with old and new values", async () => {
    await registerOuttake(1, "adoptie", "2026-02-26");

    expect(mockLogAudit).toHaveBeenCalledWith(
      "register_outtake",
      "animal",
      1,
      expect.objectContaining({ isInShelter: true }),
      expect.objectContaining({ isInShelter: false }),
    );
  });

  it("revalidates paths after outtake", async () => {
    await registerOuttake(1, "adoptie", "2026-02-26");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren/1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/beheerder/dieren/kennel");
  });

  it("returns error on database failure", async () => {
    mockUpdateReturning.mockRejectedValueOnce(new Error("DB error"));

    const result = await registerOuttake(1, "adoptie", "2026-02-26");

    expect(result.success).toBe(false);
  });

  // --- Guard override tests (Story 6.3 AC2) ---

  it("allows cat outtake override with reason", async () => {
    mockSelectLimit
      .mockResolvedValueOnce([{
        ...mockAnimal,
        species: "kat",
        identificationNr: null,
        isNeutered: true,
      }])
      .mockResolvedValueOnce([{ id: 10 }]); // has vaccinations

    const result = await registerOuttake(1, "adoptie", "2026-02-26", true, "Chip wordt morgen geplaatst");

    expect(result.success).toBe(true);
  });

  it("returns error on cat outtake override without reason", async () => {
    mockSelectLimit
      .mockResolvedValueOnce([{
        ...mockAnimal,
        species: "kat",
        identificationNr: null,
        isNeutered: true,
      }])
      .mockResolvedValueOnce([{ id: 10 }]); // has vaccinations

    const result = await registerOuttake(1, "adoptie", "2026-02-26", true);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Reden is verplicht");
  });

  it("stores override reason in audit log when guards are overridden", async () => {
    mockSelectLimit
      .mockResolvedValueOnce([{
        ...mockAnimal,
        species: "kat",
        identificationNr: null,
        isNeutered: true,
      }])
      .mockResolvedValueOnce([{ id: 10 }]); // has vaccinations

    await registerOuttake(1, "adoptie", "2026-02-26", true, "Chip wordt morgen geplaatst");

    expect(mockLogAudit).toHaveBeenCalledWith(
      "register_outtake",
      "animal",
      1,
      expect.anything(),
      expect.objectContaining({ guardOverrideReason: "Chip wordt morgen geplaatst" }),
    );
  });

  it("returns vaccination warning for cat without vaccinations", async () => {
    mockSelectLimit
      .mockResolvedValueOnce([{
        ...mockAnimal,
        species: "kat",
        identificationNr: "981000123456789",
        isNeutered: true,
      }])
      .mockResolvedValueOnce([]); // no vaccinations

    const result = await registerOuttake(1, "adoptie", "2026-02-26");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.guardWarnings).toBeDefined();
      expect(result.guardWarnings!.some((w: { code: string }) => w.code === "cat_vaccination_missing")).toBe(true);
    }
  });
});
