import { db } from "@/lib/db";
import { adoptionCandidates, animals } from "@/lib/db/schema";
import { eq, desc, isNull, sql } from "drizzle-orm";
import type { AdoptionCandidate } from "@/types";

export type AdoptionCandidateWithAnimal = AdoptionCandidate & { animalName: string | null };

export async function getAdoptionCandidates(category?: string): Promise<AdoptionCandidateWithAnimal[]> {
  try {
    const query = db
      .select({
        candidate: adoptionCandidates,
        animalName: animals.name,
      })
      .from(adoptionCandidates)
      .leftJoin(animals, eq(adoptionCandidates.animalId, animals.id));

    let results;
    if (category === "blanco") {
      results = await query
        .where(isNull(adoptionCandidates.category))
        .orderBy(desc(adoptionCandidates.createdAt))
        .limit(100);
    } else if (category) {
      results = await query
        .where(eq(adoptionCandidates.category, category))
        .orderBy(desc(adoptionCandidates.createdAt))
        .limit(100);
    } else {
      results = await query
        .orderBy(desc(adoptionCandidates.createdAt))
        .limit(100);
    }

    return results.map((r) => ({
      ...r.candidate,
      animalName: r.animalName ?? r.candidate.requestedAnimalName ?? null,
    }));
  } catch (err) {
    console.error("getAdoptionCandidates query failed:", err);
    return [];
  }
}

export async function getAllAdoptionCandidatesForExport(): Promise<AdoptionCandidateWithAnimal[]> {
  try {
    const results = await db
      .select({
        candidate: adoptionCandidates,
        animalName: animals.name,
      })
      .from(adoptionCandidates)
      .leftJoin(animals, eq(adoptionCandidates.animalId, animals.id))
      .orderBy(desc(adoptionCandidates.createdAt));

    return results.map((r) => ({
      ...r.candidate,
      animalName: r.animalName ?? r.candidate.requestedAnimalName ?? null,
    }));
  } catch (err) {
    console.error("getAllAdoptionCandidatesForExport query failed:", err);
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
