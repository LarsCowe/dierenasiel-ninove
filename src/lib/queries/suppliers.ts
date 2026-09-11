import { db } from "@/lib/db";
import { eventCosts, eventMaterials, suppliers } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import type { SupplierRow } from "@/lib/actions/suppliers";

/** Story 13.16 — de leverancierslijst, op naam. */
export async function getSuppliers(): Promise<SupplierRow[]> {
  return db.select().from(suppliers).orderBy(asc(suppliers.name));
}

/**
 * Welke leveranciersnaam op welk evenement voorkomt, uit kosten én materiaal. Het
 * tellen gebeurt in `eventCountBySupplier`; bij veertien evenementen per jaar is dat
 * goedkoper dan een groeperende query op een naam die hoofdletterongevoelig moet zijn.
 */
export async function getSupplierUsage(): Promise<{ supplier: string | null; eventId: number }[]> {
  const [kosten, materiaal] = await Promise.all([
    db.select({ supplier: eventCosts.supplier, eventId: eventCosts.eventId }).from(eventCosts),
    db.select({ supplier: eventMaterials.supplier, eventId: eventMaterials.eventId }).from(eventMaterials),
  ]);
  return [...kosten, ...materiaal];
}
