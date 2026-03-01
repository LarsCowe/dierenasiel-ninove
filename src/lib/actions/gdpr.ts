"use server";

import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { anonymizeAdoptionCandidate, anonymizeWalker } from "@/lib/gdpr/anonymize";
import {
  getCandidateExportData,
  getWalkerExportData,
  formatCandidateExportJson,
  formatCandidateExportCsv,
  formatWalkerExportJson,
  formatWalkerExportCsv,
} from "@/lib/gdpr/export";
import {
  flagExpiredRecords,
  extendRetention,
} from "@/lib/gdpr/retention";
import { getFlaggedCandidates, getFlaggedWalkers } from "@/lib/queries/gdpr";
import { RETENTION_DAYS } from "@/lib/constants";
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

export async function exportCandidateDataAction(
  candidateId: number,
  format: "json" | "csv",
): Promise<ActionResult<string>> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };
  if (!hasPermission(session.role, "gdpr:read"))
    return { success: false, error: "Onvoldoende rechten" };

  if (!candidateId || candidateId < 1)
    return { success: false, error: "Ongeldig kandidaat-ID" };

  try {
    const data = await getCandidateExportData(candidateId);
    if (!data)
      return {
        success: false,
        error: "Adoptiekandidaat niet gevonden",
      };

    const formatted =
      format === "csv"
        ? formatCandidateExportCsv(data)
        : formatCandidateExportJson(data);

    await logAudit(
      "gdpr.export_candidate",
      "adoption_candidate",
      candidateId,
      null,
      { format, exportedAt: new Date().toISOString() },
    );

    return { success: true, data: formatted };
  } catch (err) {
    console.error("exportCandidateDataAction failed:", err);
    return {
      success: false,
      error: "Er ging iets mis bij het exporteren.",
    };
  }
}

export async function exportWalkerDataAction(
  walkerId: number,
  format: "json" | "csv",
): Promise<ActionResult<string>> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };
  if (!hasPermission(session.role, "gdpr:read"))
    return { success: false, error: "Onvoldoende rechten" };

  if (!walkerId || walkerId < 1)
    return { success: false, error: "Ongeldig wandelaar-ID" };

  try {
    const data = await getWalkerExportData(walkerId);
    if (!data)
      return {
        success: false,
        error: "Wandelaar niet gevonden",
      };

    const formatted =
      format === "csv"
        ? formatWalkerExportCsv(data)
        : formatWalkerExportJson(data);

    await logAudit(
      "gdpr.export_walker",
      "walker",
      walkerId,
      null,
      { format, exportedAt: new Date().toISOString() },
    );

    return { success: true, data: formatted };
  } catch (err) {
    console.error("exportWalkerDataAction failed:", err);
    return {
      success: false,
      error: "Er ging iets mis bij het exporteren.",
    };
  }
}

// === Retention actions ===

export async function runRetentionCheckAction(): Promise<
  ActionResult<{ candidates: number; walkers: number }>
> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };
  if (!hasPermission(session.role, "gdpr:write"))
    return { success: false, error: "Onvoldoende rechten" };

  try {
    const result = await flagExpiredRecords(RETENTION_DAYS);

    await logAudit("gdpr.retention_check", "system", 0, null, {
      candidates: result.candidates,
      walkers: result.walkers,
      candidateIds: result.candidateIds,
      walkerIds: result.walkerIds,
      checkedAt: new Date().toISOString(),
    });

    revalidatePath("/beheerder/gdpr");
    return {
      success: true,
      data: result,
      message: `Bewaartermijn controle voltooid: ${result.candidates} adoptanten en ${result.walkers} wandelaars gemarkeerd.`,
    };
  } catch (err) {
    console.error("runRetentionCheckAction failed:", err);
    return {
      success: false,
      error: "Er ging iets mis bij de bewaartermijn controle.",
    };
  }
}

export async function extendRetentionAction(
  entityType: "candidate" | "walker",
  entityId: number,
  reason: string,
): Promise<ActionResult<void>> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };
  if (!hasPermission(session.role, "gdpr:write"))
    return { success: false, error: "Onvoldoende rechten" };

  if (!entityId || entityId < 1)
    return { success: false, error: "Ongeldig ID" };

  if (!reason || reason.trim().length === 0)
    return { success: false, error: "Een reden is verplicht." };

  try {
    await extendRetention(entityType, entityId, reason.trim());

    const auditEntityType =
      entityType === "candidate" ? "adoption_candidate" : "walker";

    await logAudit(
      "gdpr.retention_extended",
      auditEntityType,
      entityId,
      null,
      { reason: reason.trim(), extendedAt: new Date().toISOString() },
    );

    revalidatePath("/beheerder/gdpr");
    return {
      success: true,
      data: undefined,
      message: "Bewaartermijn is verlengd.",
    };
  } catch (err) {
    console.error("extendRetentionAction failed:", err);
    return {
      success: false,
      error: "Er ging iets mis bij het verlengen van de bewaartermijn.",
    };
  }
}

export async function getRetentionOverviewAction(): Promise<
  ActionResult<{
    flaggedCandidates: Awaited<ReturnType<typeof getFlaggedCandidates>>;
    flaggedWalkers: Awaited<ReturnType<typeof getFlaggedWalkers>>;
    summary: {
      flaggedCandidates: number;
      flaggedWalkers: number;
      totalFlagged: number;
    };
  }>
> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };
  if (!hasPermission(session.role, "gdpr:read"))
    return { success: false, error: "Onvoldoende rechten" };

  try {
    const [flaggedCandidatesList, flaggedWalkersList] = await Promise.all([
      getFlaggedCandidates(),
      getFlaggedWalkers(),
    ]);

    return {
      success: true,
      data: {
        flaggedCandidates: flaggedCandidatesList,
        flaggedWalkers: flaggedWalkersList,
        summary: {
          flaggedCandidates: flaggedCandidatesList.length,
          flaggedWalkers: flaggedWalkersList.length,
          totalFlagged:
            flaggedCandidatesList.length + flaggedWalkersList.length,
        },
      },
    };
  } catch (err) {
    console.error("getRetentionOverviewAction failed:", err);
    return {
      success: false,
      error: "Er ging iets mis bij het ophalen van het retentie-overzicht.",
    };
  }
}
