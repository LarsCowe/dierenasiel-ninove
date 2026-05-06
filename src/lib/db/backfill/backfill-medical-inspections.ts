import { db } from "@/lib/db";
import {
  strayCatCampaigns,
  strayCatCampaignMedicalInspections,
} from "@/lib/db/schema";
import { eq, sql, isNotNull, or } from "drizzle-orm";

/**
 * Backfill: zet bestaande campagne-level medische velden om naar één
 * stray_cat_campaign_medical_inspections-rij per campagne. Idempotent —
 * campagnes die al minstens één medische inspectie hebben worden
 * overgeslagen.
 *
 * We migreren alleen wanneer er minstens één betekenisvol veld is
 * (inspectionDate, vetName, fivStatus, felvStatus of outcome). De
 * inspectionDate krijgt een fallback naar requestDate als ze leeg is,
 * omdat het schema notNull vereist.
 */
export async function backfillMedicalInspections(): Promise<{
  scanned: number;
  inserted: number;
  skipped: number;
}> {
  const candidates = await db
    .select({
      id: strayCatCampaigns.id,
      requestDate: strayCatCampaigns.requestDate,
      inspectionDate: strayCatCampaigns.inspectionDate,
      vetName: strayCatCampaigns.vetName,
      catDescription: strayCatCampaigns.catDescription,
      cageAtVet: strayCatCampaigns.cageAtVet,
      fivStatus: strayCatCampaigns.fivStatus,
      felvStatus: strayCatCampaigns.felvStatus,
      outcome: strayCatCampaigns.outcome,
    })
    .from(strayCatCampaigns)
    .where(
      or(
        isNotNull(strayCatCampaigns.inspectionDate),
        isNotNull(strayCatCampaigns.vetName),
        isNotNull(strayCatCampaigns.catDescription),
        isNotNull(strayCatCampaigns.cageAtVet),
        isNotNull(strayCatCampaigns.fivStatus),
        isNotNull(strayCatCampaigns.felvStatus),
        isNotNull(strayCatCampaigns.outcome),
      ),
    );

  let inserted = 0;
  let skipped = 0;

  for (const campaign of candidates) {
    const existing = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(strayCatCampaignMedicalInspections)
      .where(eq(strayCatCampaignMedicalInspections.campaignId, campaign.id));
    const count = existing[0]?.count ?? 0;
    if (count > 0) {
      skipped++;
      continue;
    }

    const inspectionDate = campaign.inspectionDate ?? campaign.requestDate;

    await db.insert(strayCatCampaignMedicalInspections).values({
      campaignId: campaign.id,
      inspectionDate,
      vetName: campaign.vetName,
      catDescription: campaign.catDescription,
      cageAtVet: campaign.cageAtVet,
      fivStatus: campaign.fivStatus,
      felvStatus: campaign.felvStatus,
      outcome: campaign.outcome,
      notes: null,
    });
    inserted++;
  }

  return { scanned: candidates.length, inserted, skipped };
}
