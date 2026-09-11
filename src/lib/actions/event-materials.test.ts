import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockInsertReturning, mockInsertValues, mockInsert,
  mockUpdateReturning, mockUpdateWhere, mockUpdateSet, mockUpdate,
  mockDeleteWhere, mockDelete,
  mockSelectLimit, mockSelectWhere, mockSelectFrom, mockSelect,
  mockEventAccess, mockLogAudit, mockRevalidate,
} = vi.hoisted(() => {
  const mockInsertReturning = vi.fn();
  const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

  const mockUpdateReturning = vi.fn();
  const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning });
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

  const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

  return {
    mockInsertReturning, mockInsertValues, mockInsert,
    mockUpdateReturning, mockUpdateWhere, mockUpdateSet, mockUpdate,
    mockDeleteWhere, mockDelete,
    mockSelectLimit, mockSelectWhere, mockSelectFrom, mockSelect,
    mockEventAccess: vi.fn(), mockLogAudit: vi.fn(), mockRevalidate: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({
  db: { insert: mockInsert, update: mockUpdate, delete: mockDelete, select: mockSelect },
}));
vi.mock("@/lib/db/schema", () => ({ eventMaterials: Symbol("eventMaterials") }));
vi.mock("@/lib/events/event-access", () => ({ requireEventDraaiboekAccess: mockEventAccess }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidate }));
const { mockEnsureSupplier } = vi.hoisted(() => ({ mockEnsureSupplier: vi.fn() }));
vi.mock("@/lib/events/supplier-directory", () => ({ ensureSupplier: mockEnsureSupplier }));

import {
  createEventMaterial,
  updateEventMaterial,
  toggleEventMaterial,
  deleteEventMaterial,
} from "./event-materials";

function fd(data: Record<string, string | string[]>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) {
    for (const w of Array.isArray(v) ? v : [v]) f.append(k, w);
  }
  return f;
}

function insertWaarden(): Record<string, unknown> {
  return (mockInsertValues.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
}
function updateWaarden(): Record<string, unknown> {
  return (mockUpdateSet.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
}

const geldig = {
  eventId: "7",
  name: "Tent 4x8",
  quantity: "2",
  origin: "geleend",
  supplier: "Chiro Ninove",
};
const GEWEIGERD = { success: false as const, error: "Onvoldoende rechten" };

// Story 13.16 — ook een trekker die materiaal invult, vult zo de leverancierslijst aan.
describe("leverancierslijst (Story 13.16)", () => {
  it("geeft de leverancier door aan de lijst na het bewaren", async () => {
    const res = await createEventMaterial(null, fd(geldig));
    expect(res.success).toBe(true);
    expect(mockEnsureSupplier).toHaveBeenCalledWith("Chiro Ninove");
  });

  it("ook bij het wijzigen van een regel", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 3, eventId: 7 }]);
    const res = await updateEventMaterial(null, fd({ id: "3", ...geldig, supplier: "Verhuur Van Damme" }));
    expect(res.success).toBe(true);
    expect(mockEnsureSupplier).toHaveBeenCalledWith("Verhuur Van Damme");
  });

  // Review 13.16: een verwijderde leverancier mag niet terugkomen doordat iemand
  // enkel het aantal van een regel met die naam aanpast.
  it("niet opnieuw wanneer de leverancier van de regel niet wijzigt", async () => {
    mockSelectLimit.mockResolvedValueOnce([{ id: 3, eventId: 7, supplier: "chiro ninove " }]);
    const res = await updateEventMaterial(null, fd({ id: "3", ...geldig }));
    expect(res.success).toBe(true);
    expect(mockEnsureSupplier).not.toHaveBeenCalled();
  });

  it("niet zonder toegang tot het draaiboek van dat evenement", async () => {
    mockEventAccess.mockResolvedValue(GEWEIGERD);
    await createEventMaterial(null, fd(geldig));
    expect(mockEnsureSupplier).not.toHaveBeenCalled();
  });
});

beforeEach(() => {
  vi.clearAllMocks();
  mockEventAccess.mockResolvedValue(undefined);
  mockLogAudit.mockResolvedValue(undefined);
  mockInsertReturning.mockResolvedValue([{ id: 3, eventId: 7 }]);
  mockUpdateReturning.mockResolvedValue([{ id: 3, eventId: 7 }]);
  mockSelectLimit.mockResolvedValue([{ id: 3, eventId: 7, name: "Oud" }]);
});

describe("createEventMaterial", () => {
  it("weigert wie geen toegang heeft tot het evenement", async () => {
    mockEventAccess.mockResolvedValue(GEWEIGERD);
    expect(await createEventMaterial(null, fd(geldig))).toEqual(GEWEIGERD);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("controleert de toegang op het evenement waar de regel bij komt", async () => {
    await createEventMaterial(null, fd(geldig));
    expect(mockEventAccess).toHaveBeenCalledWith(7);
  });

  it("bewaart de regel met herkomst en leverancier", async () => {
    const res = await createEventMaterial(null, fd(geldig));
    expect(res.success).toBe(true);
    expect(insertWaarden()).toMatchObject({
      eventId: 7,
      name: "Tent 4x8",
      quantity: 2,
      origin: "geleend",
      supplier: "Chiro Ninove",
      arranged: false,
      returned: false,
    });
  });

  it("laat een leeg aantal leeg", async () => {
    await createEventMaterial(null, fd({ ...geldig, quantity: "" }));
    expect(insertWaarden().quantity).toBeNull();
  });

  it("leest het vinkje 'geregeld' via het hidden+checkbox-patroon", async () => {
    await createEventMaterial(null, fd({ ...geldig, arranged: ["false", "true"] }));
    expect(insertWaarden().arranged).toBe(true);
  });

  it("eist een omschrijving", async () => {
    const res = await createEventMaterial(null, fd({ ...geldig, name: " " }));
    expect(res.success).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("weigert een onbekende herkomst", async () => {
    const res = await createEventMaterial(null, fd({ ...geldig, origin: "gevonden" }));
    expect(res.success).toBe(false);
    if (!res.success) expect(res.fieldErrors?.origin?.[0]).toBeTruthy();
  });

  it("weigert een aantal van nul", async () => {
    expect((await createEventMaterial(null, fd({ ...geldig, quantity: "0" }))).success).toBe(false);
  });
});

describe("updateEventMaterial", () => {
  it("bewaart de wijziging", async () => {
    const res = await updateEventMaterial(null, fd({ ...geldig, id: "3", supplier: "Gemeente" }));
    expect(res.success).toBe(true);
    expect(updateWaarden()).toMatchObject({ supplier: "Gemeente" });
  });

  it("meldt een regel die niet meer bestaat", async () => {
    mockSelectLimit.mockResolvedValue([]);
    expect((await updateEventMaterial(null, fd({ ...geldig, id: "3" }))).success).toBe(false);
  });

  it("weigert wie geen toegang heeft tot het evenement van de regel", async () => {
    mockEventAccess.mockResolvedValue(GEWEIGERD);
    expect(await updateEventMaterial(null, fd({ ...geldig, id: "3" }))).toEqual(GEWEIGERD);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("controleert het evenement van de bestaande regel en verhuist ze niet", async () => {
    await updateEventMaterial(null, fd({ ...geldig, id: "3", eventId: "99" }));
    expect(mockEventAccess).toHaveBeenCalledWith(7);
    expect(mockEventAccess).not.toHaveBeenCalledWith(99);
    expect(updateWaarden()).toMatchObject({ eventId: 7 });
  });
});

describe("toggleEventMaterial", () => {
  it("zet 'terugbezorgd' aan", async () => {
    const res = await toggleEventMaterial(3, "returned", true);
    expect(res.success).toBe(true);
    expect(updateWaarden()).toMatchObject({ returned: true });
  });

  it("zet 'geregeld' weer uit", async () => {
    await toggleEventMaterial(3, "arranged", false);
    expect(updateWaarden()).toMatchObject({ arranged: false });
  });

  it("weigert een veld dat niet mag", async () => {
    // @ts-expect-error — bewust een verkeerde veldnaam
    const res = await toggleEventMaterial(3, "name", true);
    expect(res.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("weigert wie geen toegang heeft tot het evenement van de regel", async () => {
    mockEventAccess.mockResolvedValue(GEWEIGERD);
    expect((await toggleEventMaterial(3, "returned", true)).success).toBe(false);
    expect(mockEventAccess).toHaveBeenCalledWith(7);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("deleteEventMaterial", () => {
  it("verwijdert de regel en logt dat", async () => {
    const res = await deleteEventMaterial(3);
    expect(res.success).toBe(true);
    expect(mockLogAudit).toHaveBeenCalledWith(
      "delete_event_material", "event_material", 3, expect.anything(), null,
    );
  });

  it("weigert wie geen toegang heeft tot het evenement van de regel", async () => {
    mockEventAccess.mockResolvedValue(GEWEIGERD);
    expect((await deleteEventMaterial(3)).success).toBe(false);
    expect(mockEventAccess).toHaveBeenCalledWith(7);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
