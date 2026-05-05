import { db } from "@/lib/db";
import { adoptionContracts, adoptionCandidates, animals } from "@/lib/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
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

export async function getContractById(id: number): Promise<AdoptionContract | null> {
  try {
    const results = await db
      .select()
      .from(adoptionContracts)
      .where(eq(adoptionContracts.id, id))
      .limit(1);
    return (results[0] as AdoptionContract) ?? null;
  } catch (err) {
    console.error("getContractById query failed:", err);
    return null;
  }
}

export interface ContractListItem {
  id: number;
  contractDate: string;
  paymentAmount: string;
  paymentMethod: string;
  status: string;
  signedDocumentUrl: string | null;
  candidateId: number | null;
  candidateFirstName: string;
  candidateLastName: string;
  animalId: number;
  animalName: string;
  animalSpecies: string;
}

export async function getContractsList(options?: {
  status?: string;
  search?: string;
}): Promise<ContractListItem[]> {
  try {
    const conditions = [];
    if (options?.status && options.status !== "alle") {
      conditions.push(eq(adoptionContracts.status, options.status));
    }
    if (options?.search) {
      const term = `%${options.search}%`;
      conditions.push(
        or(
          ilike(adoptionCandidates.firstName, term),
          ilike(adoptionCandidates.lastName, term),
          ilike(adoptionContracts.snapshotAdoptantFirstName, term),
          ilike(adoptionContracts.snapshotAdoptantLastName, term),
          ilike(animals.name, term),
          ilike(adoptionContracts.snapshotAnimalName, term),
        )!,
      );
    }

    // Story 10.20+: snapshot eerst, dan fallback op kandidaat. Rechtstreekse contracten
    // hebben geen kandidaat, en oude contracten hebben (nog) geen snapshot.
    const rows = await db
      .select({
        id: adoptionContracts.id,
        contractDate: adoptionContracts.contractDate,
        paymentAmount: adoptionContracts.paymentAmount,
        paymentMethod: adoptionContracts.paymentMethod,
        status: adoptionContracts.status,
        signedDocumentUrl: adoptionContracts.signedDocumentUrl,
        candidateId: adoptionContracts.candidateId,
        candidateFirstName: sql<string>`COALESCE(${adoptionContracts.snapshotAdoptantFirstName}, ${adoptionCandidates.firstName}, '')`,
        candidateLastName: sql<string>`COALESCE(${adoptionContracts.snapshotAdoptantLastName}, ${adoptionCandidates.lastName}, '')`,
        animalId: adoptionContracts.animalId,
        animalName: sql<string>`COALESCE(${adoptionContracts.snapshotAnimalName}, ${animals.name}, '')`,
        animalSpecies: sql<string>`COALESCE(${adoptionContracts.snapshotAnimalSpecies}, ${animals.species}, '')`,
      })
      .from(adoptionContracts)
      .leftJoin(adoptionCandidates, eq(adoptionContracts.candidateId, adoptionCandidates.id))
      .leftJoin(animals, eq(adoptionContracts.animalId, animals.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(adoptionContracts.createdAt));

    return rows as ContractListItem[];
  } catch (err) {
    console.error("getContractsList query failed:", err);
    return [];
  }
}

export async function getContractCountsByStatus(): Promise<Record<string, number>> {
  try {
    const rows = await db
      .select({
        status: adoptionContracts.status,
        count: sql<number>`count(*)::int`,
      })
      .from(adoptionContracts)
      .groupBy(adoptionContracts.status);
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.status] = row.count;
    }
    return counts;
  } catch (err) {
    console.error("getContractCountsByStatus query failed:", err);
    return {};
  }
}
