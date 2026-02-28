import { db } from "@/lib/db";
import { animalWorkflowHistory, animals } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { AnimalWorkflowHistory } from "@/types";

export async function getWorkflowHistoryByAnimalId(animalId: number): Promise<AnimalWorkflowHistory[]> {
  try {
    return await db
      .select()
      .from(animalWorkflowHistory)
      .where(eq(animalWorkflowHistory.animalId, animalId))
      .orderBy(desc(animalWorkflowHistory.createdAt));
  } catch (err) {
    console.error("getWorkflowHistoryByAnimalId query failed:", err);
    return [];
  }
}

export async function getCurrentPhase(animalId: number): Promise<string | null> {
  try {
    const results = await db
      .select({ workflowPhase: animals.workflowPhase })
      .from(animals)
      .where(eq(animals.id, animalId))
      .limit(1);

    if (results.length === 0) return null;
    return results[0].workflowPhase;
  } catch (err) {
    console.error("getCurrentPhase query failed:", err);
    return null;
  }
}
