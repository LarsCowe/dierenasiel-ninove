import { put, del } from "@vercel/blob";
import { db } from "@/lib/db";
import { strayCatCampaigns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { getCampaignById } from "@/lib/queries/stray-cat-campaigns";
import { NextResponse } from "next/server";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  if (!hasPermission(session.role, "stray_cat:write")) {
    return NextResponse.json({ error: "Onvoldoende rechten" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const campaignId = Number(formData.get("campaignId"));

  if (!file || !campaignId || isNaN(campaignId)) {
    return NextResponse.json(
      { error: "Foto en campagne-ID zijn verplicht" },
      { status: 400 },
    );
  }

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: "Ongeldig bestandstype. Toegestaan: JPEG, PNG, WebP." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Bestand te groot (max 10MB)" },
      { status: 400 },
    );
  }

  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    return NextResponse.json(
      { error: "Campagne niet gevonden" },
      { status: 404 },
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
  const path = `zwerfkatten/${campaignId}/${Date.now()}-${safeName}`;

  try {
    const blob = await put(path, file, { access: "public" });

    await db
      .update(strayCatCampaigns)
      .set({ photoUrl: blob.url })
      .where(eq(strayCatCampaigns.id, campaignId));

    if (campaign.photoUrl) {
      try {
        await del(campaign.photoUrl);
      } catch {
        // Old blob cleanup is best-effort
      }
    }

    await logAudit(
      "stray_cat_campaign.photo_uploaded",
      "stray_cat_campaign",
      campaignId,
      null,
      { photoUrl: blob.url },
    );

    return NextResponse.json({ success: true, data: { photoUrl: blob.url } });
  } catch {
    return NextResponse.json(
      { error: "Foto uploaden mislukt. Probeer opnieuw." },
      { status: 500 },
    );
  }
}
