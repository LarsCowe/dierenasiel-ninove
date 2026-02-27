import { db } from "@/lib/db";
import { vetInspectionReports } from "@/lib/db/schema";
import { eq, desc, gte, lte, and, sql } from "drizzle-orm";
import type { VetInspectionReport } from "@/types";

export async function getVetInspectionReports(): Promise<VetInspectionReport[]> {
  try {
    const results = await db
      .select()
      .from(vetInspectionReports)
      .orderBy(desc(vetInspectionReports.visitDate))
      .limit(50);
    return results as VetInspectionReport[];
  } catch (err) {
    console.error("getVetInspectionReports query failed:", err);
    return [];
  }
}

export async function getVetInspectionReportById(id: number): Promise<VetInspectionReport | null> {
  try {
    const results = await db
      .select()
      .from(vetInspectionReports)
      .where(eq(vetInspectionReports.id, id))
      .limit(1);
    return (results[0] as VetInspectionReport) ?? null;
  } catch (err) {
    console.error("getVetInspectionReportById query failed:", err);
    return null;
  }
}

export async function countReportsThisWeek(): Promise<number> {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const mondayStr = monday.toISOString().slice(0, 10);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const sundayStr = sunday.toISOString().slice(0, 10);

    const results = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vetInspectionReports)
      .where(
        and(
          gte(vetInspectionReports.visitDate, mondayStr),
          lte(vetInspectionReports.visitDate, sundayStr),
        ),
      );
    return (results[0]?.count as number) ?? 0;
  } catch (err) {
    console.error("countReportsThisWeek query failed:", err);
    return 0;
  }
}
