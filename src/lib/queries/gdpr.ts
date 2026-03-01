import { db } from "@/lib/db";
import { adoptionCandidates, walkers, kennismakingen, adoptionContracts, postAdoptionFollowups, walks, animals } from "@/lib/db/schema";
import { eq, or, ilike, and, isNull, isNotNull, lt } from "drizzle-orm";

const SEARCH_LIMIT = 50;

/** Escape ILIKE wildcards so user input is treated as literal text. */
function escapeIlike(input: string): string {
  return input.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Search adoption candidates by name or email for GDPR operations.
 */
export async function searchCandidatesForGdpr(query: string) {
  const pattern = `%${escapeIlike(query)}%`;
  return db
    .select()
    .from(adoptionCandidates)
    .where(
      or(
        ilike(adoptionCandidates.firstName, pattern),
        ilike(adoptionCandidates.lastName, pattern),
        ilike(adoptionCandidates.email, pattern),
      ),
    )
    .limit(SEARCH_LIMIT);
}

/**
 * Search walkers by name or email for GDPR operations.
 */
export async function searchWalkersForGdpr(query: string) {
  const pattern = `%${escapeIlike(query)}%`;
  return db
    .select()
    .from(walkers)
    .where(
      or(
        ilike(walkers.firstName, pattern),
        ilike(walkers.lastName, pattern),
        ilike(walkers.email, pattern),
      ),
    )
    .limit(SEARCH_LIMIT);
}

/**
 * Get a single adoption candidate by ID for GDPR detail view.
 */
export async function getAdoptionCandidateForGdpr(candidateId: number) {
  const [candidate] = await db
    .select()
    .from(adoptionCandidates)
    .where(eq(adoptionCandidates.id, candidateId))
    .limit(1);

  return candidate ?? null;
}

/**
 * Get a single walker by ID for GDPR detail view.
 */
export async function getWalkerForGdpr(walkerId: number) {
  const [walker] = await db
    .select()
    .from(walkers)
    .where(eq(walkers.id, walkerId))
    .limit(1);

  return walker ?? null;
}

// === Export query helpers ===

const EXPORT_LIMIT = 1000;

/**
 * Get all kennismakingen for a candidate (GDPR export).
 */
export async function getKennismakingenForExport(candidateId: number) {
  return db
    .select()
    .from(kennismakingen)
    .where(eq(kennismakingen.adoptionCandidateId, candidateId))
    .limit(EXPORT_LIMIT);
}

/**
 * Get all adoption contracts for a candidate (GDPR export).
 */
export async function getContractsForExport(candidateId: number) {
  return db
    .select()
    .from(adoptionContracts)
    .where(eq(adoptionContracts.candidateId, candidateId))
    .limit(EXPORT_LIMIT);
}

/**
 * Get all post-adoption followups for a contract (GDPR export).
 */
export async function getFollowupsForExport(contractId: number) {
  return db
    .select()
    .from(postAdoptionFollowups)
    .where(eq(postAdoptionFollowups.contractId, contractId))
    .limit(EXPORT_LIMIT);
}

/**
 * Get all walks for a walker (GDPR export).
 */
export async function getWalksForExport(walkerId: number) {
  return db
    .select()
    .from(walks)
    .where(eq(walks.walkerId, walkerId))
    .limit(EXPORT_LIMIT);
}

/**
 * Get animal name by ID (for export data enrichment).
 */
export async function getAnimalNameById(animalId: number) {
  const [animal] = await db
    .select({ name: animals.name })
    .from(animals)
    .where(eq(animals.id, animalId))
    .limit(1);

  return animal?.name ?? null;
}

// === Retention query helpers ===

const RETENTION_LIMIT = 500;

/**
 * Get adoption candidates past retention period that haven't been flagged or anonymised.
 */
export async function getExpiredCandidates(retentionDays: number) {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(adoptionCandidates)
    .where(
      and(
        lt(adoptionCandidates.createdAt, cutoffDate),
        isNull(adoptionCandidates.anonymisedAt),
        isNull(adoptionCandidates.retentionFlaggedAt),
        or(
          isNull(adoptionCandidates.retentionExtendedAt),
          lt(adoptionCandidates.retentionExtendedAt, cutoffDate),
        ),
      ),
    )
    .limit(RETENTION_LIMIT);
}

/**
 * Get walkers past retention period that haven't been flagged or anonymised.
 */
export async function getExpiredWalkers(retentionDays: number) {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(walkers)
    .where(
      and(
        lt(walkers.createdAt, cutoffDate),
        isNull(walkers.anonymisedAt),
        isNull(walkers.retentionFlaggedAt),
        or(
          isNull(walkers.retentionExtendedAt),
          lt(walkers.retentionExtendedAt, cutoffDate),
        ),
      ),
    )
    .limit(RETENTION_LIMIT);
}

/**
 * Get adoption candidates that have been flagged for retention review.
 */
export async function getFlaggedCandidates() {
  return db
    .select()
    .from(adoptionCandidates)
    .where(
      and(
        isNotNull(adoptionCandidates.retentionFlaggedAt),
        isNull(adoptionCandidates.anonymisedAt),
      ),
    )
    .limit(RETENTION_LIMIT);
}

/**
 * Get walkers that have been flagged for retention review.
 */
export async function getFlaggedWalkers() {
  return db
    .select()
    .from(walkers)
    .where(
      and(
        isNotNull(walkers.retentionFlaggedAt),
        isNull(walkers.anonymisedAt),
      ),
    )
    .limit(RETENTION_LIMIT);
}
