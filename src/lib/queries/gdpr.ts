import { db } from "@/lib/db";
import { adoptionCandidates, walkers } from "@/lib/db/schema";
import { eq, or, ilike } from "drizzle-orm";

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
