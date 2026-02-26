import { db } from "@/lib/db";
import { medications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Medication } from "@/types";

export async function getMedicationsByAnimalId(
  animalId: number,
): Promise<Medication[]> {
  try {
    return await db
      .select()
      .from(medications)
      .where(eq(medications.animalId, animalId))
      .orderBy(desc(medications.startDate)) as Medication[];
  } catch (err) {
    console.error("getMedicationsByAnimalId query failed:", err);
    return [];
  }
}
