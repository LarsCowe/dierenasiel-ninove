import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { strayCatCampaignPhotos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { getCampaignPhotoById } from "@/lib/queries/stray-cat-campaigns";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  if (!hasPermission(session.role, "stray_cat:write")) {
    return NextResponse.json({ error: "Onvoldoende rechten" }, { status: 403 });
  }

  const { id } = await params;
  const photoId = Number(id);
  if (!photoId || isNaN(photoId)) {
    return NextResponse.json({ error: "Ongeldig ID" }, { status: 400 });
  }

  const existing = await getCampaignPhotoById(photoId);
  if (!existing) {
    return NextResponse.json({ error: "Foto niet gevonden" }, { status: 404 });
  }

  try {
    await del(existing.blobUrl);
  } catch {
    // best-effort blob cleanup
  }

  await db.delete(strayCatCampaignPhotos).where(eq(strayCatCampaignPhotos.id, photoId));

  await logAudit(
    "stray_cat_campaign.photo_deleted",
    "stray_cat_campaign_photo",
    photoId,
    { campaignId: existing.campaignId, blobUrl: existing.blobUrl, fileName: existing.fileName },
    null,
  );

  return NextResponse.json({ success: true });
}
