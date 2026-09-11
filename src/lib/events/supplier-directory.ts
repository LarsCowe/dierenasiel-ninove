import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { supplierKey } from "./suppliers";

/**
 * Story 13.16 — een naam die op een kosten- of materiaalregel getypt wordt, komt vanzelf
 * in de leverancierslijst. Enkel de naam: de contactgegevens vul je daar aan.
 *
 * Gooit nooit. De regel zelf is op dat moment al bewaard, en een naam die in de lijst
 * ontbreekt, is geen reden om de gebruiker een fout te tonen. Wie de regel opnieuw
 * bewaart, probeert het opnieuw.
 */
export async function ensureSupplier(name: string | null | undefined): Promise<void> {
  const key = supplierKey(name);
  if (!key) return;

  try {
    const [bestaand] = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(sql`lower(trim(${suppliers.name})) = ${key}`)
      .limit(1);
    if (bestaand) return;

    await db.insert(suppliers).values({ name: (name as string).trim() });
  } catch (err) {
    console.error("ensureSupplier mislukt:", err);
  }
}
