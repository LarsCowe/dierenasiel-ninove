import { db } from "@/lib/db";
import { behaviorRecords, users } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function getBehaviorRecordsByAnimalId(animalId: number) {
  try {
    const results = await db
      .select()
      .from(behaviorRecords)
      .where(eq(behaviorRecords.animalId, animalId))
      .orderBy(desc(behaviorRecords.date));
    return results;
  } catch (err) {
    console.error("getBehaviorRecordsByAnimalId query failed:", err);
    return [];
  }
}

export async function countBehaviorRecords(animalId: number): Promise<number> {
  try {
    const results = await db
      .select({ count: count() })
      .from(behaviorRecords)
      .where(eq(behaviorRecords.animalId, animalId));
    return Number(results[0]?.count ?? 0);
  } catch (err) {
    console.error("countBehaviorRecords query failed:", err);
    return 0;
  }
}

export async function getLatestBehaviorRecord(animalId: number) {
  try {
    const results = await db
      .select()
      .from(behaviorRecords)
      .where(eq(behaviorRecords.animalId, animalId))
      .orderBy(desc(behaviorRecords.date))
      .limit(1);
    return results[0] ?? null;
  } catch (err) {
    console.error("getLatestBehaviorRecord query failed:", err);
    return null;
  }
}
