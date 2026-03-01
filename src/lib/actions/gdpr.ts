"use server";

import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { anonymizeAdoptionCandidate, anonymizeWalker } from "@/lib/gdpr/anonymize";
import type { ActionResult } from "@/types";

export async function anonymizeCandidateAction(
  candidateId: number,
): Promise<ActionResult<void>> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };
  if (!hasPermission(session.role, "gdpr:write"))
    return { success: false, error: "Onvoldoende rechten" };

  if (!candidateId || candidateId < 1)
    return { success: false, error: "Ongeldig kandidaat-ID" };

  try {
    const oldRecord = await anonymizeAdoptionCandidate(candidateId);
    if (!oldRecord)
      return {
        success: false,
        error: "Adoptiekandidaat niet gevonden of al geanonimiseerd",
      };

    await logAudit(
      "gdpr.anonymise_candidate",
      "adoption_candidate",
      candidateId,
      oldRecord,
      { anonymisedAt: new Date().toISOString() },
    );

    revalidatePath("/beheerder/gdpr");
    return {
      success: true,
      data: undefined,
      message: "Persoonsgegevens zijn geanonimiseerd.",
    };
  } catch (err) {
    console.error("anonymizeCandidateAction failed:", err);
    return {
      success: false,
      error: "Er ging iets mis bij het anonimiseren.",
    };
  }
}

export async function anonymizeWalkerAction(
  walkerId: number,
): Promise<ActionResult<void>> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };
  if (!hasPermission(session.role, "gdpr:write"))
    return { success: false, error: "Onvoldoende rechten" };

  if (!walkerId || walkerId < 1)
    return { success: false, error: "Ongeldig wandelaar-ID" };

  try {
    const oldRecord = await anonymizeWalker(walkerId);
    if (!oldRecord)
      return {
        success: false,
        error: "Wandelaar niet gevonden of al geanonimiseerd",
      };

    await logAudit(
      "gdpr.anonymise_walker",
      "walker",
      walkerId,
      oldRecord,
      { anonymisedAt: new Date().toISOString() },
    );

    revalidatePath("/beheerder/gdpr");
    return {
      success: true,
      data: undefined,
      message: "Persoonsgegevens zijn geanonimiseerd.",
    };
  } catch (err) {
    console.error("anonymizeWalkerAction failed:", err);
    return {
      success: false,
      error: "Er ging iets mis bij het anonimiseren.",
    };
  }
}
