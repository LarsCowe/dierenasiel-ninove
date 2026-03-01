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
