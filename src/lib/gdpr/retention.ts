import { db } from "@/lib/db";
import { adoptionCandidates, walkers } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import {
  getExpiredCandidates,
  getExpiredWalkers,
  getFlaggedCandidates,
  getFlaggedWalkers,
} from "@/lib/queries/gdpr";

/**
 * Batch-flag all records that exceed the retention period.
 * Returns the count and IDs of newly flagged records per type.
 */
export async function flagExpiredRecords(retentionDays: number) {
  const [expiredCandidates, expiredWalkers] = await Promise.all([
    getExpiredCandidates(retentionDays),
    getExpiredWalkers(retentionDays),
  ]);

  const now = new Date();
  const candidateIds = expiredCandidates.map((c) => c.id);
  const walkerIds = expiredWalkers.map((w) => w.id);

  if (candidateIds.length > 0) {
    await db
      .update(adoptionCandidates)
      .set({ retentionFlaggedAt: now })
      .where(inArray(adoptionCandidates.id, candidateIds));
  }

  if (walkerIds.length > 0) {
    await db
      .update(walkers)
      .set({ retentionFlaggedAt: now })
      .where(inArray(walkers.id, walkerIds));
  }

  return {
    candidates: candidateIds.length,
    walkers: walkerIds.length,
    candidateIds,
    walkerIds,
  };
}

/**
 * Extend the retention period for a flagged record.
 * Clears the flag and stores the extension reason.
 */
export async function extendRetention(
  entityType: "candidate" | "walker",
  entityId: number,
  reason: string,
) {
  const table = entityType === "candidate" ? adoptionCandidates : walkers;

  await db
    .update(table)
    .set({
      retentionFlaggedAt: null,
      retentionExtendedAt: new Date(),
      retentionExtensionReason: reason,
    })
    .where(eq(table.id, entityId));
}

/**
 * Get a summary of flagged records for the retention overview.
 */
export async function getRetentionSummary() {
  const [flaggedCandidatesList, flaggedWalkersList] = await Promise.all([
    getFlaggedCandidates(),
    getFlaggedWalkers(),
  ]);

  const flaggedCandidates = flaggedCandidatesList.length;
  const flaggedWalkers = flaggedWalkersList.length;

  return {
    flaggedCandidates,
    flaggedWalkers,
    totalFlagged: flaggedCandidates + flaggedWalkers,
  };
}
