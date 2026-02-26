import { db } from "@/lib/db";
import { vetVisits } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { VetVisit } from "@/types";

export async function getVetVisitsByAnimalId(
  animalId: number,
): Promise<VetVisit[]> {
  try {
    return await db
      .select()
      .from(vetVisits)
      .where(eq(vetVisits.animalId, animalId))
      .orderBy(desc(vetVisits.date)) as VetVisit[];
  } catch (err) {
    console.error("getVetVisitsByAnimalId query failed:", err);
    return [];
  }
}
