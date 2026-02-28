import { db } from "@/lib/db";
import { adoptionContracts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { AdoptionContract } from "@/types";

export async function getContractByCandidateId(candidateId: number): Promise<AdoptionContract | null> {
  try {
    const results = await db
      .select()
      .from(adoptionContracts)
      .where(eq(adoptionContracts.candidateId, candidateId))
      .limit(1);
    return (results[0] as AdoptionContract) ?? null;
  } catch (err) {
    console.error("getContractByCandidateId query failed:", err);
    return null;
  }
}
