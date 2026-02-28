import { db } from "@/lib/db";
import { postAdoptionFollowups, adoptionContracts, adoptionCandidates, animals } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import type { PostAdoptionFollowup } from "@/types";

export async function getFollowupsByContractId(contractId: number): Promise<PostAdoptionFollowup[]> {
  try {
    return await db
      .select()
      .from(postAdoptionFollowups)
      .where(eq(postAdoptionFollowups.contractId, contractId))
      .orderBy(asc(postAdoptionFollowups.date)) as PostAdoptionFollowup[];
  } catch (err) {
    console.error("getFollowupsByContractId query failed:", err);
    return [];
  }
}

export interface FollowupOverviewRow {
  followup: {
    id: number;
    followupType: string;
    date: string;
    status: string;
    contractId: number;
    notes: string | null;
  };
  animal: {
    id: number;
    name: string;
    species: string;
  };
  candidate: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
}

export async function getPlannedFollowupsForOverview(): Promise<FollowupOverviewRow[]> {
  try {
    return await db
      .select({
        followup: {
          id: postAdoptionFollowups.id,
          followupType: postAdoptionFollowups.followupType,
          date: postAdoptionFollowups.date,
          status: postAdoptionFollowups.status,
          contractId: postAdoptionFollowups.contractId,
          notes: postAdoptionFollowups.notes,
        },
        animal: {
          id: animals.id,
          name: animals.name,
          species: animals.species,
        },
        candidate: {
          id: adoptionCandidates.id,
          firstName: adoptionCandidates.firstName,
          lastName: adoptionCandidates.lastName,
          phone: adoptionCandidates.phone,
        },
      })
      .from(postAdoptionFollowups)
      .innerJoin(adoptionContracts, eq(postAdoptionFollowups.contractId, adoptionContracts.id))
      .innerJoin(animals, eq(adoptionContracts.animalId, animals.id))
      .innerJoin(adoptionCandidates, eq(adoptionContracts.candidateId, adoptionCandidates.id))
      .where(eq(postAdoptionFollowups.status, "planned"))
      .orderBy(asc(postAdoptionFollowups.date)) as FollowupOverviewRow[];
  } catch (err) {
    console.error("getPlannedFollowupsForOverview query failed:", err);
    return [];
  }
}
