import { db } from "@/lib/db";
import { neglectReports } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { NeglectReport } from "@/types";

export async function getNeglectReportByAnimalId(
  animalId: number,
): Promise<NeglectReport | null> {
  try {
    const results = await db
      .select()
      .from(neglectReports)
      .where(eq(neglectReports.animalId, animalId))
      .limit(1);
    return (results[0] as NeglectReport) ?? null;
  } catch (err) {
    console.error("getNeglectReportByAnimalId query failed:", err);
    return null;
  }
}

export async function hasNeglectReport(animalId: number): Promise<boolean> {
  try {
    const results = await db
      .select()
      .from(neglectReports)
      .where(eq(neglectReports.animalId, animalId))
      .limit(1);
    return results.length > 0;
  } catch (err) {
    console.error("hasNeglectReport query failed:", err);
    return false;
  }
}
