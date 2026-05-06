import { db } from "@/lib/db";
import { strayCatCampaigns, strayCatCampaignPhotos } from "@/lib/db/schema";
import { eq, isNotNull, sql } from "drizzle-orm";

/**
 * Migreert het oude single-photo veld strayCatCampaigns.photoUrl naar de
 * nieuwe stray_cat_campaign_photos-tabel. Idempotent: campagnes die al
 * minstens één foto in de nieuwe tabel hebben worden overgeslagen.
 */
export async function backfillCampaignPhotos(): Promise<{
  scanned: number;
  inserted: number;
  skipped: number;
}> {
  const campaigns = await db
    .select({
      id: strayCatCampaigns.id,
      photoUrl: strayCatCampaigns.photoUrl,
    })
    .from(strayCatCampaigns)
    .where(isNotNull(strayCatCampaigns.photoUrl));

  let inserted = 0;
  let skipped = 0;

  for (const campaign of campaigns) {
    const existing = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(strayCatCampaignPhotos)
      .where(eq(strayCatCampaignPhotos.campaignId, campaign.id));
    const count = existing[0]?.count ?? 0;
    if (count > 0) {
      skipped++;
      continue;
    }

    if (!campaign.photoUrl) continue;

    let fileName = "legacy-photo";
    try {
      const url = new URL(campaign.photoUrl);
      const segments = url.pathname.split("/").filter(Boolean);
      fileName = segments[segments.length - 1] ?? fileName;
    } catch {
      // ignore parse error, behoud default
    }

    await db.insert(strayCatCampaignPhotos).values({
      campaignId: campaign.id,
      blobUrl: campaign.photoUrl,
      fileName,
      fileSize: 0,
      mimeType: null,
      uploadedBy: null,
    });
    inserted++;
  }

  return { scanned: campaigns.length, inserted, skipped };
}
