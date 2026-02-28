import { db } from "@/lib/db";
import { walkers } from "@/lib/db/schema";
import { eq, desc, gte, lt, and, sql } from "drizzle-orm";
import type { Walker } from "@/types";

export async function getWalkersForAdmin(statusFilter?: string): Promise<Walker[]> {
  try {
    const query = db.select().from(walkers);

    // Custom ordering: pending first, then by createdAt desc
    const orderExpr = sql`CASE WHEN ${walkers.status} = 'pending' THEN 0 ELSE 1 END`;

    const results = statusFilter
      ? await query
          .where(eq(walkers.status, statusFilter))
          .orderBy(orderExpr, desc(walkers.createdAt))
          .limit(50)
      : await query
          .orderBy(orderExpr, desc(walkers.createdAt))
          .limit(50);

    return results as Walker[];
  } catch (err) {
    console.error("getWalkersForAdmin query failed:", err);
    return [];
  }
}

export async function getWalkerById(id: number): Promise<Walker | null> {
  try {
    const results = await db
      .select()
      .from(walkers)
      .where(eq(walkers.id, id))
      .limit(1);
    return (results[0] as Walker) ?? null;
  } catch (err) {
    console.error("getWalkerById query failed:", err);
    return null;
  }
}

export async function getWalkingClubMembers(): Promise<Walker[]> {
  try {
    const results = await db
      .select()
      .from(walkers)
      .where(eq(walkers.isWalkingClubMember, true))
      .orderBy(desc(walkers.walkCount))
      .limit(100);
    return results as Walker[];
  } catch (err) {
    console.error("getWalkingClubMembers query failed:", err);
    return [];
  }
}

export async function getNearThresholdWalkers(threshold: number): Promise<Walker[]> {
  const minCount = Math.floor(threshold * 0.8);
  try {
    const results = await db
      .select()
      .from(walkers)
      .where(
        and(
          gte(walkers.walkCount, minCount),
          lt(walkers.walkCount, threshold),
          eq(walkers.isWalkingClubMember, false),
        )
      )
      .orderBy(desc(walkers.walkCount))
      .limit(50);
    return results as Walker[];
  } catch (err) {
    console.error("getNearThresholdWalkers query failed:", err);
    return [];
  }
}
