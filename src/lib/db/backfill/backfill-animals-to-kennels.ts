import { db } from "@/lib/db";
import { animals, kennels } from "@/lib/db/schema";
import { and, eq, isNotNull, isNull, asc } from "drizzle-orm";

/**
 * Story 10.12 demo-backfill: wijs dieren met foto en zonder kennel
 * toe aan passende kennels op basis van species → zone.
 *
 * - hond → H-zone kennels
 * - kat  → K-zone kennels
 * - ander → A-zone kennels
 *
 * Idempotent: skip als kennel reeds capacity bereikt heeft OF als het
 * dier al in een kennel zit. Laat bestaande koppelingen ongemoeid.
 */

const SPECIES_TO_ZONE: Record<string, string> = {
  hond: "honden",
  kat: "katten",
  ander: "andere",
};

export async function backfillAnimalsToKennels(): Promise<{
  scanned: number;
  assigned: number;
  skipped: number;
}> {
  // Alle kandidaat-dieren: met foto, nog niet in kennel, nog in asiel
  const candidates = await db
    .select({
      id: animals.id,
      name: animals.name,
      species: animals.species,
    })
    .from(animals)
    .where(
      and(
        isNotNull(animals.imageUrl),
        isNull(animals.kennelId),
        eq(animals.isInShelter, true),
      ),
    )
    .orderBy(asc(animals.id));

  // Alle actieve kennels met huidige bezetting
  const kennelsList = await db.select().from(kennels).orderBy(asc(kennels.code));

  // Bouw een map kennelId → current count via een query over animals.kennelId
  const occupied = await db
    .select({ kennelId: animals.kennelId })
    .from(animals)
    .where(and(isNotNull(animals.kennelId), eq(animals.isInShelter, true)));

  const countByKennel = new Map<number, number>();
  for (const row of occupied) {
    if (row.kennelId === null) continue;
    countByKennel.set(row.kennelId, (countByKennel.get(row.kennelId) ?? 0) + 1);
  }

  let assigned = 0;
  let skipped = 0;

  for (const animal of candidates) {
    const targetZone = SPECIES_TO_ZONE[animal.species];
    if (!targetZone) {
      skipped++;
      continue;
    }

    const kennel = kennelsList.find(
      (k) =>
        k.zone === targetZone &&
        k.isActive &&
        (countByKennel.get(k.id) ?? 0) < k.capacity,
    );

    if (!kennel) {
      skipped++;
      continue;
    }

    await db
      .update(animals)
      .set({ kennelId: kennel.id })
      .where(eq(animals.id, animal.id));

    countByKennel.set(kennel.id, (countByKennel.get(kennel.id) ?? 0) + 1);
    assigned++;
  }

  return { scanned: candidates.length, assigned, skipped };
}
