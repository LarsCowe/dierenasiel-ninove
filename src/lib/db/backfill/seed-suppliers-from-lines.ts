import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { getSupplierUsage } from "@/lib/queries/suppliers";
import { missingSupplierNames } from "@/lib/events/suppliers";

/**
 * Story 13.16 — zet de leveranciersnamen die al op kosten- en materiaalregels staan in
 * de lijst. Herhaalbaar: een naam die er al staat (ook met andere hoofdletters), wordt
 * overgeslagen. Enkel de naam; de gegevens vult iemand aan op het scherm.
 */
export async function seedSuppliersFromLines(): Promise<string[]> {
  const [bestaand, gebruik] = await Promise.all([
    db.select({ name: suppliers.name }).from(suppliers),
    getSupplierUsage(),
  ]);

  const nieuw = missingSupplierNames(
    bestaand.map((s) => s.name),
    gebruik.map((g) => g.supplier),
  );
  if (nieuw.length > 0) await db.insert(suppliers).values(nieuw.map((name) => ({ name })));
  return nieuw;
}
