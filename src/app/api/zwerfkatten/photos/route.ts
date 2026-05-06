import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { strayCatCampaignPhotos } from "@/lib/db/schema";
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

    const inserted = await db
      .insert(strayCatCampaignPhotos)
      .values({
        campaignId,
        blobUrl: blob.url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: session.email ?? null,
      })
      .returning({ id: strayCatCampaignPhotos.id });

    const id = inserted[0]?.id;

    await logAudit(
      "stray_cat_campaign.photo_added",
      "stray_cat_campaign_photo",
      id,
      null,
      { campaignId, blobUrl: blob.url, fileName: file.name },
    );

    return NextResponse.json({
      success: true,
      data: { id, blobUrl: blob.url, fileName: file.name },
    });
  } catch (err) {
    console.error("upload-photo failed:", err);
    return NextResponse.json(
      { error: "Foto uploaden mislukt. Probeer opnieuw." },
      { status: 500 },
    );
  }
}
