"use server";

import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { strayCatCampaigns, strayCatCampaignInspections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCampaignById, getOccupiedCageNumbers } from "@/lib/queries/stray-cat-campaigns";
import {
  createCampaignSchema,
  deployCagesSchema,
  registerInspectionSchema,
  completeCampaignSchema,
  linkAnimalSchema,
  addInspectionSchema,
} from "@/lib/validations/stray-cat-campaigns";
import type { ActionResult } from "@/types";

const REVALIDATE_PATH = "/beheerder/dieren/zwerfkattenbeleid";

async function requireAuth(): Promise<
  | { success: true; session: { userId: number; role: string } }
  | { success: false; error: string }
> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };
  if (!hasPermission(session.role, "stray_cat:write"))
    return { success: false, error: "Onvoldoende rechten" };
  return { success: true, session };
}

export async function createCampaignAction(
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: number }>> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = createCampaignSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Ongeldige invoer", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const rows = await db
      .insert(strayCatCampaigns)
      .values({
        requestDate: parsed.data.requestDate,
        municipality: parsed.data.municipality,
        address: parsed.data.address,
        remarks: parsed.data.remarks || null,
        status: "open",
      })
      .returning({ id: strayCatCampaigns.id });

    const campaignId = rows[0].id;

    await logAudit(
      "stray_cat_campaign.created",
      "stray_cat_campaign",
      campaignId,
      null,
      { municipality: parsed.data.municipality, address: parsed.data.address },
    );

    revalidatePath(REVALIDATE_PATH);
    return { success: true, data: { id: campaignId } };
  } catch (error) {
    console.error("createCampaignAction failed:", error);
    return { success: false, error: "Campagne aanmaken mislukt. Probeer opnieuw." };
  }
}

export async function deployCagesAction(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = deployCagesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Ongeldige invoer", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const campaign = await getCampaignById(parsed.data.campaignId);
    if (!campaign) return { success: false, error: "Campagne niet gevonden" };
    if (campaign.status !== "open")
      return { success: false, error: "Campagne moet status 'open' hebben" };

    // Story 10.7: kooinummers mogen niet reeds in een andere lopende campagne gebruikt worden.
    const requestedCages = parsed.data.cageNumbers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const occupied = await getOccupiedCageNumbers(parsed.data.campaignId);
    for (const num of requestedCages) {
      if (occupied[num]) {
        return {
          success: false,
          error: `Kooi ${num} is al in gebruik in campagne #${occupied[num]}.`,
        };
      }
    }

    await db
      .update(strayCatCampaigns)
      .set({
        cageDeploymentDate: parsed.data.cageDeploymentDate,
        cageNumbers: parsed.data.cageNumbers,
        status: "kooien_geplaatst",
      })
      .where(eq(strayCatCampaigns.id, parsed.data.campaignId));

    await logAudit(
      "stray_cat_campaign.cages_deployed",
      "stray_cat_campaign",
      parsed.data.campaignId,
      { status: "open" },
      { status: "kooien_geplaatst", cageNumbers: parsed.data.cageNumbers },
    );

    revalidatePath(REVALIDATE_PATH);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("deployCagesAction failed:", error);
    return { success: false, error: "Kooi-uitzetting registreren mislukt. Probeer opnieuw." };
  }
}

export async function registerInspectionAction(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = registerInspectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Ongeldige invoer", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const campaign = await getCampaignById(parsed.data.campaignId);
    if (!campaign) return { success: false, error: "Campagne niet gevonden" };
    if (campaign.status !== "kooien_geplaatst")
      return { success: false, error: "Campagne moet status 'kooien_geplaatst' hebben" };

    await db
      .update(strayCatCampaigns)
      .set({
        inspectionDate: parsed.data.inspectionDate,
        catDescription: parsed.data.catDescription,
        vetName: parsed.data.vetName,
        cageAtVet: parsed.data.cageAtVet || null,
        status: "in_behandeling",
      })
      .where(eq(strayCatCampaigns.id, parsed.data.campaignId));

    await logAudit(
      "stray_cat_campaign.inspection_registered",
      "stray_cat_campaign",
      parsed.data.campaignId,
      { status: "kooien_geplaatst" },
      { status: "in_behandeling", vetName: parsed.data.vetName },
    );

    revalidatePath(REVALIDATE_PATH);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("registerInspectionAction failed:", error);
    return { success: false, error: "Inspectie registreren mislukt. Probeer opnieuw." };
  }
}

export async function completeCampaignAction(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = completeCampaignSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Ongeldige invoer", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const campaign = await getCampaignById(parsed.data.campaignId);
    if (!campaign) return { success: false, error: "Campagne niet gevonden" };
    if (campaign.status !== "in_behandeling")
      return { success: false, error: "Campagne moet status 'in_behandeling' hebben" };

    await db
      .update(strayCatCampaigns)
      .set({
        fivStatus: parsed.data.fivStatus,
        felvStatus: parsed.data.felvStatus,
        outcome: parsed.data.outcome,
        remarks: parsed.data.remarks ?? campaign.remarks,
        status: "afgerond",
      })
      .where(eq(strayCatCampaigns.id, parsed.data.campaignId));

    await logAudit(
      "stray_cat_campaign.completed",
      "stray_cat_campaign",
      parsed.data.campaignId,
      { status: "in_behandeling" },
      { status: "afgerond", outcome: parsed.data.outcome },
    );

    revalidatePath(REVALIDATE_PATH);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("completeCampaignAction failed:", error);
    return { success: false, error: "Campagne afronden mislukt. Probeer opnieuw." };
  }
}

export async function linkAnimalAction(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = linkAnimalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Ongeldige invoer", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const campaign = await getCampaignById(parsed.data.campaignId);
    if (!campaign) return { success: false, error: "Campagne niet gevonden" };
    if (campaign.outcome !== "geadopteerd")
      return { success: false, error: "Alleen campagnes met uitkomst 'geadopteerd' kunnen aan een dier gekoppeld worden" };

    await db
      .update(strayCatCampaigns)
      .set({ linkedAnimalId: parsed.data.linkedAnimalId })
      .where(eq(strayCatCampaigns.id, parsed.data.campaignId));

    await logAudit(
      "stray_cat_campaign.animal_linked",
      "stray_cat_campaign",
      parsed.data.campaignId,
      { linkedAnimalId: campaign.linkedAnimalId },
      { linkedAnimalId: parsed.data.linkedAnimalId },
    );

    revalidatePath(REVALIDATE_PATH);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("linkAnimalAction failed:", error);
    return { success: false, error: "Dier koppelen mislukt. Probeer opnieuw." };
  }
}

/**
 * Story 10.9: log-entry toevoegen voor een inspectiebezoek (kan succesvol of leeg zijn).
 * Wijzigt de campagne-status NIET — puur een audit-log.
 */
export async function addInspectionAction(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.success) return { success: false, error: auth.error };

  const parsed = addInspectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Ongeldige invoer", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const campaign = await getCampaignById(parsed.data.campaignId);
    if (!campaign) return { success: false, error: "Campagne niet gevonden" };

    const [record] = await db
      .insert(strayCatCampaignInspections)
      .values({
        campaignId: parsed.data.campaignId,
        inspectionDate: parsed.data.inspectionDate,
        wasSuccessful: parsed.data.wasSuccessful,
        notes: parsed.data.notes || null,
      })
      .returning();

    await logAudit(
      "stray_cat_campaign.inspection_log_added",
      "stray_cat_campaign",
      parsed.data.campaignId,
      null,
      { inspectionId: record.id, inspectionDate: record.inspectionDate, wasSuccessful: record.wasSuccessful },
    );

    revalidatePath(REVALIDATE_PATH);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("addInspectionAction failed:", error);
    return { success: false, error: "Inspectie-log toevoegen mislukt. Probeer opnieuw." };
  }
}
