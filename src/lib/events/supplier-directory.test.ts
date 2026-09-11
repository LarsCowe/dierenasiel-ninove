import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSelectLimit, mockSelect, mockInsertValues, mockInsert } = vi.hoisted(() => {
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn().mockReturnValue({ limit: mockSelectLimit });
  const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });
  const mockInsertValues = vi.fn().mockResolvedValue(undefined);
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
  return { mockSelectLimit, mockSelect, mockInsertValues, mockInsert };
});

vi.mock("@/lib/db", () => ({ db: { select: mockSelect, insert: mockInsert } }));
vi.mock("@/lib/db/schema", () => ({ suppliers: { id: "suppliers.id", name: "suppliers.name" } }));

import { ensureSupplier } from "./supplier-directory";

// Story 13.16 — een naam die je op een kosten- of materiaalregel typt, komt vanzelf
// in de leverancierslijst. Enkel de naam: de contactgegevens vul je daar later aan.

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectLimit.mockReset();
  mockSelectLimit.mockResolvedValue([]);
});

describe("ensureSupplier", () => {
  it("doet niets bij een lege naam", async () => {
    await ensureSupplier("   ");
    await ensureSupplier(null);
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("voegt een nieuwe naam toe, zonder spaties aan de randen", async () => {
    await ensureSupplier("  Chiro Ninove ");
    expect(mockInsertValues).toHaveBeenCalledWith({ name: "Chiro Ninove" });
  });

  it("voegt niets toe wanneer de naam al in de lijst staat", async () => {
    mockSelectLimit.mockResolvedValueOnce([{ id: 1 }]);
    await ensureSupplier("chiro ninove");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("gooit nooit een fout: de regel zelf is dan al bewaard", async () => {
    mockSelectLimit.mockRejectedValueOnce(new Error("DB weg"));
    await expect(ensureSupplier("Chiro Ninove")).resolves.toBeUndefined();
  });
});
