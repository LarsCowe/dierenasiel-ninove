import { db } from "@/lib/db";
import { strayCatCampaigns, strayCatCampaignInspections } from "@/lib/db/schema";
import { eq, isNotNull } from "drizzle-orm";

/**
 * Backfill: voor elke campagne met `inspectionDate` niet-null maar zonder
 * overeenkomstige log-entry wordt één entry in `strayCatCampaignInspections`
 * aangemaakt met `was_successful=true` (want de bestaande inspectionDate
 * weerspiegelt een succesvolle inspectie die de campagne naar `in_behandeling`
 * heeft gebracht).
 *
 * Idempotent: campagnes die al minstens één log-entry hebben worden overgeslagen.
 */
export async function backfillInspectionLog(): Promise<{ scanned: number; created: number }> {
  const campaigns = await db
    .select({ id: strayCatCampaigns.id, inspectionDate: strayCatCampaigns.inspectionDate })
    .from(strayCatCampaigns)
    .where(isNotNull(strayCatCampaigns.inspectionDate));

  let created = 0;
  for (const c of campaigns) {
    // Bestaat er al een log-entry voor deze campagne? Dan overslaan.
    const existing = await db
      .select({ id: strayCatCampaignInspections.id })
      .from(strayCatCampaignInspections)
      .where(eq(strayCatCampaignInspections.campaignId, c.id))
      .limit(1);
    if (existing.length > 0) continue;

    await db.insert(strayCatCampaignInspections).values({
      campaignId: c.id,
      inspectionDate: c.inspectionDate!,
      wasSuccessful: true,
      notes: "Backfill — oorspronkelijke inspectiedatum voor Story 10.9",
    });
    created++;
  }

  return { scanned: campaigns.length, created };
}
