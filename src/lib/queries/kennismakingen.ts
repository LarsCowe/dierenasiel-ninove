import { db } from "@/lib/db";
import { kennismakingen } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Kennismaking } from "@/types";

export async function getKennismakingenByCandidateId(candidateId: number): Promise<Kennismaking[]> {
  try {
    const results = await db
      .select()
      .from(kennismakingen)
      .where(eq(kennismakingen.adoptionCandidateId, candidateId))
      .orderBy(desc(kennismakingen.scheduledAt))
      .limit(20);
    return results as Kennismaking[];
  } catch (err) {
    console.error("getKennismakingenByCandidateId query failed:", err);
    return [];
  }
}

export async function getKennismakingById(id: number): Promise<Kennismaking | null> {
  try {
    const results = await db
      .select()
      .from(kennismakingen)
      .where(eq(kennismakingen.id, id))
      .limit(1);
    return (results[0] as Kennismaking) ?? null;
  } catch (err) {
    console.error("getKennismakingById query failed:", err);
    return null;
  }
}
