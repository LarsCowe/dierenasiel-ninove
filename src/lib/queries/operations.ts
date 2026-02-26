import { db } from "@/lib/db";
import { operations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Operation } from "@/types";

export async function getOperationsByAnimalId(
  animalId: number,
): Promise<Operation[]> {
  try {
    return await db
      .select()
      .from(operations)
      .where(eq(operations.animalId, animalId))
      .orderBy(desc(operations.date)) as Operation[];
  } catch (err) {
    console.error("getOperationsByAnimalId query failed:", err);
    return [];
  }
}
