import { db } from "@/lib/db";
import { adoptionCandidates, animals } from "@/lib/db/schema";
import { eq, desc, isNull, or, and, sql } from "drizzle-orm";
import type { AdoptionCandidate } from "@/types";

export type AdoptionCandidateWithAnimal = AdoptionCandidate & { animalName: string | null };

export async function getAdoptionCandidates(
  category?: string,
  animalId?: number,
): Promise<AdoptionCandidateWithAnimal[]> {
  try {
    const baseQuery = db
      .select({
        candidate: adoptionCandidates,
        animalName: animals.name,
      })
      .from(adoptionCandidates)
      .leftJoin(animals, eq(adoptionCandidates.animalId, animals.id));

    const conditions = [];

    if (category === "blanco") {
      conditions.push(and(
        or(isNull(adoptionCandidates.reviewMartine), eq(adoptionCandidates.reviewMartine, "in_beraad")),
        or(isNull(adoptionCandidates.reviewNathalie), eq(adoptionCandidates.reviewNathalie, "in_beraad")),
        or(isNull(adoptionCandidates.reviewSven), eq(adoptionCandidates.reviewSven, "in_beraad")),
      ));
    } else if (category) {
      conditions.push(eq(adoptionCandidates.category, category));
    }

    if (typeof animalId === "number") {
      conditions.push(eq(adoptionCandidates.animalId, animalId));
    }

    const query = conditions.length
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await query
      .orderBy(desc(adoptionCandidates.createdAt))
      .limit(100);

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

export async function getAnimalNameById(id: number): Promise<string | null> {
  try {
    const results = await db
      .select({ name: animals.name })
      .from(animals)
      .where(eq(animals.id, id))
      .limit(1);
    return results[0]?.name ?? null;
  } catch (err) {
    console.error("getAnimalNameById query failed:", err);
    return null;
  }
}
