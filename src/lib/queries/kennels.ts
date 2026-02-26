import { db } from "@/lib/db";
import { kennels, animals } from "@/lib/db/schema";
import { eq, sql, count, asc } from "drizzle-orm";
import type { Animal, Kennel } from "@/types";

export async function getKennels(): Promise<Kennel[]> {
  try {
    const results = await db
      .select()
      .from(kennels)
      .where(eq(kennels.isActive, true))
      .orderBy(asc(kennels.zone), asc(kennels.code));
    return results as Kennel[];
  } catch (err) {
    console.error("getKennels query failed:", err);
    return [];
  }
}

export type KennelWithOccupancy = {
  kennel: Kennel;
  count: number;
};

export async function getAnimalsInKennels(): Promise<Record<number, Animal[]>> {
  try {
    const results = await db
      .select()
      .from(animals)
      .where(
        sql`${animals.kennelId} IS NOT NULL AND ${animals.isInShelter} = true`,
      );
    const grouped: Record<number, Animal[]> = {};
    for (const animal of results) {
      const kid = animal.kennelId!;
      if (!grouped[kid]) grouped[kid] = [];
      grouped[kid].push(animal as Animal);
    }
    return grouped;
  } catch (err) {
    console.error("getAnimalsInKennels query failed:", err);
    return {};
  }
}

export async function getKennelOccupancy(): Promise<KennelWithOccupancy[]> {
  try {
    const results = await db
      .select({
        kennel: kennels,
        count: count(animals.id),
      })
      .from(kennels)
      .leftJoin(
        animals,
        sql`${animals.kennelId} = ${kennels.id} AND ${animals.isInShelter} = true`,
      )
      .where(eq(kennels.isActive, true))
      .groupBy(kennels.id)
      .orderBy(asc(kennels.zone), asc(kennels.code));
    return results as KennelWithOccupancy[];
  } catch (err) {
    console.error("getKennelOccupancy query failed:", err);
    return [];
  }
}
