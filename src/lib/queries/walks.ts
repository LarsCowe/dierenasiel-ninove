import { db } from "@/lib/db";
import { animals, walkers, walks } from "@/lib/db/schema";
import { eq, and, asc, desc, inArray, max } from "drizzle-orm";
import type { Animal, Walker, Walk, ActiveWalkForAdmin, WalkHistoryEntry, WalkStats } from "@/types";

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

const walkHistorySelect = {
  id: walks.id,
  date: walks.date,
  startTime: walks.startTime,
  endTime: walks.endTime,
  durationMinutes: walks.durationMinutes,
  remarks: walks.remarks,
  status: walks.status,
  walkerFirstName: walkers.firstName,
  walkerLastName: walkers.lastName,
  animalName: animals.name,
};

export async function getWalkHistoryByWalkerId(walkerId: number): Promise<WalkHistoryEntry[]> {
  try {
    const results = await db
      .select(walkHistorySelect)
      .from(walks)
      .innerJoin(walkers, eq(walks.walkerId, walkers.id))
      .innerJoin(animals, eq(walks.animalId, animals.id))
      .where(eq(walks.walkerId, walkerId))
      .orderBy(desc(walks.date));
    return results as WalkHistoryEntry[];
  } catch (err) {
    console.error("getWalkHistoryByWalkerId query failed:", err);
    return [];
  }
}

export async function getWalkHistoryByAnimalId(animalId: number): Promise<WalkHistoryEntry[]> {
  try {
    const results = await db
      .select(walkHistorySelect)
      .from(walks)
      .innerJoin(walkers, eq(walks.walkerId, walkers.id))
      .innerJoin(animals, eq(walks.animalId, animals.id))
      .where(eq(walks.animalId, animalId))
      .orderBy(desc(walks.date));
    return results as WalkHistoryEntry[];
  } catch (err) {
    console.error("getWalkHistoryByAnimalId query failed:", err);
    return [];
  }
}

export function computeWalkStats(
  entries: WalkHistoryEntry[],
  companionField: "animalName" | "walkerName",
): WalkStats {
  if (entries.length === 0) {
    return { totalWalks: 0, avgDurationMinutes: null, topCompanion: null };
  }

  const durations = entries
    .map((e) => e.durationMinutes)
    .filter((d): d is number => d !== null);

  const avgDurationMinutes = durations.length > 0
    ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
    : null;

  // Count companion frequency
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const name = companionField === "animalName"
      ? entry.animalName
      : `${entry.walkerFirstName} ${entry.walkerLastName}`;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  let topCompanion: string | null = null;
  let maxCount = 0;
  for (const [name, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      topCompanion = name;
    }
  }

  return { totalWalks: entries.length, avgDurationMinutes, topCompanion };
}

export async function getLastWalkDates(walkerIds: number[]): Promise<Map<number, string>> {
  const result = new Map<number, string>();
  if (walkerIds.length === 0) return result;

  try {
    const rows = await db
      .select({
        walkerId: walks.walkerId,
        lastDate: max(walks.date),
      })
      .from(walks)
      .where(
        and(
          inArray(walks.walkerId, walkerIds),
          eq(walks.status, "completed"),
        ),
      )
      .groupBy(walks.walkerId);

    for (const row of rows) {
      if (row.lastDate) {
        result.set(row.walkerId, row.lastDate);
      }
    }
  } catch (err) {
    console.error("getLastWalkDates query failed:", err);
  }

  return result;
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
