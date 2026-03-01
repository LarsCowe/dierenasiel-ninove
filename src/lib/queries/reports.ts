import { db } from "@/lib/db";
import { animals, behaviorRecords } from "@/lib/db/schema";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import type { Animal, BehaviorRecord } from "@/types";

export interface AnimalReportFilters {
  species?: string;
  status?: string;
  kennelId?: number;
  workflowPhase?: string;
  page?: number;
  pageSize?: number;
}

export interface AnimalReportResult {
  animals: Animal[];
  total: number;
}

export async function getAnimalReport(
  filters: AnimalReportFilters,
): Promise<AnimalReportResult> {
  const { species, status, kennelId, workflowPhase, page, pageSize } = filters;

  const conditions = [];
  if (species) conditions.push(eq(animals.species, species));
  if (status) conditions.push(eq(animals.status, status));
  if (kennelId) conditions.push(eq(animals.kennelId, kennelId));
  if (workflowPhase) conditions.push(eq(animals.workflowPhase, workflowPhase));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    if (page && pageSize) {
      const results = await db
        .select()
        .from(animals)
        .where(whereClause)
        .orderBy(asc(animals.name))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const totalResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(animals)
        .where(whereClause);

      return {
        animals: results as Animal[],
        total: (totalResult as { count: number }[])[0]?.count ?? 0,
      };
    }

    // No pagination — return all results (used for PDF/CSV export)
    const results = await db
      .select()
      .from(animals)
      .where(whereClause)
      .orderBy(asc(animals.name));

    return {
      animals: results as Animal[],
      total: results.length,
    };
  } catch (err) {
    console.error("getAnimalReport query failed:", err);
    return { animals: [], total: 0 };
  }
}

export async function getBehaviorReportByAnimalId(
  animalId: number,
): Promise<BehaviorRecord[]> {
  try {
    const results = await db
      .select()
      .from(behaviorRecords)
      .where(eq(behaviorRecords.animalId, animalId))
      .orderBy(desc(behaviorRecords.date));
    return results as BehaviorRecord[];
  } catch (err) {
    console.error("getBehaviorReportByAnimalId query failed:", err);
    return [];
  }
}
