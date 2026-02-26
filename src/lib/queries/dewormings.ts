import { db } from "@/lib/db";
import { dewormings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Deworming } from "@/types";

export async function getDewormingsByAnimalId(
  animalId: number,
): Promise<Deworming[]> {
  try {
    return await db
      .select()
      .from(dewormings)
      .where(eq(dewormings.animalId, animalId))
      .orderBy(desc(dewormings.date)) as Deworming[];
  } catch (err) {
    console.error("getDewormingsByAnimalId query failed:", err);
    return [];
  }
}
