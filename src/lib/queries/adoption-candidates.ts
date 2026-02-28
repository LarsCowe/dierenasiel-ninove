import { db } from "@/lib/db";
import { adoptionCandidates } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { AdoptionCandidate } from "@/types";

export async function getAdoptionCandidates(category?: string): Promise<AdoptionCandidate[]> {
  try {
    const query = db.select().from(adoptionCandidates);

    const results = category
      ? await query
          .where(eq(adoptionCandidates.category, category))
          .orderBy(desc(adoptionCandidates.createdAt))
          .limit(50)
      : await query
          .orderBy(desc(adoptionCandidates.createdAt))
          .limit(50);

    return results as AdoptionCandidate[];
  } catch (err) {
    console.error("getAdoptionCandidates query failed:", err);
    return [];
  }
}

export async function getAdoptionCandidateById(id: number): Promise<AdoptionCandidate | null> {
  try {
    const results = await db
      .select()
      .from(adoptionCandidates)
      .where(eq(adoptionCandidates.id, id))
      .limit(1);
    return (results[0] as AdoptionCandidate) ?? null;
  } catch (err) {
    console.error("getAdoptionCandidateById query failed:", err);
    return null;
  }
}
