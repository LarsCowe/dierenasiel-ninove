import { db } from "@/lib/db";
import { animals, walkers, walks } from "@/lib/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import type { Animal, Walker, Walk, ActiveWalkForAdmin } from "@/types";

export async function getDogsAvailableForWalking(): Promise<Animal[]> {
  try {
    const results = await db
      .select()
      .from(animals)
      .where(
        and(
          eq(animals.species, "hond"),
          eq(animals.isInShelter, true),
        ),
      )
      .orderBy(asc(animals.name));
    return results as Animal[];
  } catch (err) {
    console.error("getDogsAvailableForWalking query failed:", err);
    return [];
  }
}

export async function getWalkerByUserId(userId: number): Promise<Walker | null> {
  try {
    const results = await db
      .select()
      .from(walkers)
      .where(eq(walkers.userId, userId))
      .limit(1);
    return (results[0] as Walker) ?? null;
  } catch (err) {
    console.error("getWalkerByUserId query failed:", err);
    return null;
  }
}

export async function getWalksByWalkerId(walkerId: number): Promise<Walk[]> {
  try {
    const results = await db
      .select()
      .from(walks)
      .where(eq(walks.walkerId, walkerId))
      .orderBy(desc(walks.date));
    return results as Walk[];
  } catch (err) {
    console.error("getWalksByWalkerId query failed:", err);
    return [];
  }
}

export async function getActiveWalksForAdmin(): Promise<ActiveWalkForAdmin[]> {
  try {
    const results = await db
      .select({
        id: walks.id,
        walkerId: walks.walkerId,
        animalId: walks.animalId,
        date: walks.date,
        startTime: walks.startTime,
        status: walks.status,
        walkerFirstName: walkers.firstName,
        walkerLastName: walkers.lastName,
        walkerPhone: walkers.phone,
        animalName: animals.name,
      })
      .from(walks)
      .innerJoin(walkers, eq(walks.walkerId, walkers.id))
      .innerJoin(animals, eq(walks.animalId, animals.id))
      .where(eq(walks.status, "in_progress"))
      .orderBy(asc(walks.startTime));
    return results as ActiveWalkForAdmin[];
  } catch (err) {
    console.error("getActiveWalksForAdmin query failed:", err);
    return [];
  }
}
