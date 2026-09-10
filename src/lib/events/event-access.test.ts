import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSelectLimit, mockSelectWhere, mockSelectFrom, mockSelect, mockGetSession } = vi.hoisted(() => {
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });
  return { mockSelectLimit, mockSelectWhere, mockSelectFrom, mockSelect, mockGetSession: vi.fn() };
});

vi.mock("@/lib/db", () => ({ db: { select: mockSelect } }));
vi.mock("@/lib/db/schema", () => ({ events: Symbol("events") }));
vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));

import { requireEventDraaiboekAccess } from "./event-access";

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectLimit.mockReset();
  mockSelectLimit.mockResolvedValue([{ trekkerUserId: 4 }]);
});

describe("requireEventDraaiboekAccess", () => {
  it("weigert wie niet aangemeld is, zonder de databank te raadplegen", async () => {
    mockGetSession.mockResolvedValue(null);
    expect(await requireEventDraaiboekAccess(7)).toEqual({ success: false, error: "Niet ingelogd" });
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("weigert een ongeldig evenementnummer", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "beheerder" });
    expect((await requireEventDraaiboekAccess(0))?.success).toBe(false);
    expect((await requireEventDraaiboekAccess(Number.NaN))?.success).toBe(false);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("meldt een evenement dat niet bestaat", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "beheerder" });
    mockSelectLimit.mockResolvedValue([]);
    expect(await requireEventDraaiboekAccess(7)).toEqual({
      success: false,
      error: "Evenement niet gevonden",
    });
  });

  it("laat de beheerder door bij elk evenement", async () => {
    mockGetSession.mockResolvedValue({ userId: 1, role: "beheerder" });
    expect(await requireEventDraaiboekAccess(7)).toBeUndefined();
  });

  it("laat de trekker van dít evenement door", async () => {
    mockGetSession.mockResolvedValue({ userId: 4, role: "medewerker" });
    expect(await requireEventDraaiboekAccess(7)).toBeUndefined();
  });

  it("weigert een oud-trekker wiens rol intussen wandelaar is", async () => {
    // De acties zijn ook buiten /beheerder aan te roepen; de rol moet dus hier meetellen.
    mockGetSession.mockResolvedValue({ userId: 4, role: "wandelaar" });
    expect(await requireEventDraaiboekAccess(7)).toEqual({
      success: false,
      error: "Onvoldoende rechten",
    });
  });

  it("weigert een medewerker die er geen trekker van is", async () => {
    mockGetSession.mockResolvedValue({ userId: 5, role: "medewerker" });
    expect(await requireEventDraaiboekAccess(7)).toEqual({
      success: false,
      error: "Onvoldoende rechten",
    });
  });
});
