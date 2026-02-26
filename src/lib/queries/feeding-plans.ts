import { db } from "@/lib/db";
import { feedingPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { FeedingPlan } from "@/types";

export async function getFeedingPlanByAnimalId(
  animalId: number,
): Promise<FeedingPlan | null> {
  try {
    const results = await db
      .select()
      .from(feedingPlans)
      .where(eq(feedingPlans.animalId, animalId))
      .limit(1);
    return (results[0] as FeedingPlan) ?? null;
  } catch (err) {
    console.error("getFeedingPlanByAnimalId query failed:", err);
    return null;
  }
}
