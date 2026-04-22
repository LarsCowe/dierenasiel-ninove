import { db } from "@/lib/db";
import { veterinaryDiagnoses } from "@/lib/db/schema";

/**
 * Alfabetisch alle bekende diagnoses (Story 10.10).
 * Gebruikt door het bezoekrapport-formulier om een datalist te vullen.
 */
export async function getAllDiagnoses(): Promise<{ id: number; name: string }[]> {
  try {
    const rows = await db
      .select({ id: veterinaryDiagnoses.id, name: veterinaryDiagnoses.name })
      .from(veterinaryDiagnoses)
      .orderBy(veterinaryDiagnoses.name);
    return rows;
  } catch (err) {
    console.error("getAllDiagnoses failed:", err);
    return [];
  }
}
