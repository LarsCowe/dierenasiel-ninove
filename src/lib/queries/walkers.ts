import { db } from "@/lib/db";
import { walkers } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
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
