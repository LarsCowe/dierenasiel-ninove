import { db } from "@/lib/db";
import { vaccinations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Vaccination } from "@/types";

export async function getVaccinationsByAnimalId(
  animalId: number,
): Promise<Vaccination[]> {
  try {
    return await db
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.animalId, animalId))
      .orderBy(desc(vaccinations.date)) as Vaccination[];
  } catch (err) {
    console.error("getVaccinationsByAnimalId query failed:", err);
    return [];
  }
}
