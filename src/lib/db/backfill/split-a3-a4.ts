import { db } from "@/lib/db";
import { animals, kennels } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Story 10.12 demo-split: verdeelt de 2 "andere" dieren die bij de
 * eerdere backfill in A3 terechtkwamen over A3 en A4, zodat beide
 * vakjes een zichtbare bewoner (met foto) hebben.
 */
async function split() {
  const [a3] = await db.select().from(kennels).where(eq(kennels.code, "A3"));
  const [a4] = await db.select().from(kennels).where(eq(kennels.code, "A4"));
  if (!a3 || !a4) throw new Error("A3 of A4 niet gevonden");

  const inA3 = await db
    .select({ id: animals.id, name: animals.name })
    .from(animals)
    .where(and(eq(animals.kennelId, a3.id), eq(animals.isInShelter, true)));

  if (inA3.length < 2) {
    console.log(`A3 heeft ${inA3.length} dier(en) — niks te splitsen.`);
    process.exit(0);
  }

  // Behoud het eerste dier in A3, verplaats de tweede naar A4.
  const moveToA4 = inA3[1];
  await db
    .update(animals)
    .set({ kennelId: a4.id })
    .where(eq(animals.id, moveToA4.id));

  console.log(`✓ ${inA3[0].name} blijft in A3, ${moveToA4.name} verplaatst naar A4.`);
  process.exit(0);
}

split().catch((err) => {
  console.error(err);
  process.exit(1);
});
