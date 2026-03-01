"use server";

import {
  anonymizeCandidateAction,
  anonymizeWalkerAction,
  exportCandidateDataAction,
  exportWalkerDataAction,
  runRetentionCheckAction,
  extendRetentionAction,
  getRetentionOverviewAction,
} from "@/lib/actions/gdpr";
import {
  searchCandidatesForGdpr,
  searchWalkersForGdpr,
  getAdoptionCandidateForGdpr,
  getWalkerForGdpr,
} from "@/lib/queries/gdpr";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import type { GdprSearchResult } from "@/types";

export async function searchPersonsAction(query: string): Promise<GdprSearchResult[]> {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "gdpr:read")) return [];

  if (!query || query.trim().length < 2) return [];
  const trimmed = query.trim();

  try {
    const [candidates, walkers] = await Promise.all([
      searchCandidatesForGdpr(trimmed),
      searchWalkersForGdpr(trimmed),
    ]);

    const results: GdprSearchResult[] = [
      ...candidates.map((c) => ({
        type: "candidate" as const,
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        anonymisedAt: c.anonymisedAt,
      })),
      ...walkers.map((w) => ({
        type: "walker" as const,
        id: w.id,
        firstName: w.firstName,
        lastName: w.lastName,
        email: w.email,
        anonymisedAt: w.anonymisedAt,
      })),
    ];

    return results;
  } catch (error) {
    console.error("GDPR search failed:", error);
    return [];
  }
}

export async function getCandidateDetailAction(candidateId: number) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "gdpr:read")) return null;
  return getAdoptionCandidateForGdpr(candidateId);
}

export async function getWalkerDetailAction(walkerId: number) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "gdpr:read")) return null;
  return getWalkerForGdpr(walkerId);
}

export {
  anonymizeCandidateAction,
  anonymizeWalkerAction,
  exportCandidateDataAction,
  exportWalkerDataAction,
  runRetentionCheckAction,
  extendRetentionAction,
  getRetentionOverviewAction,
};
