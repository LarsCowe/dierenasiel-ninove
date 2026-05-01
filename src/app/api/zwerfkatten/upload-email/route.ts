import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { strayCatCampaignAttachments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { getCampaignById } from "@/lib/queries/stray-cat-campaigns";
import { NextResponse } from "next/server";

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
      { error: "Bestand en campagne-ID zijn verplicht" },
      { status: 400 },
    );
  }

  // Outlook stuurt .eml soms met mimeType application/octet-stream — extensie is leidend.
  if (!file.name.toLowerCase().endsWith(".eml")) {
    return NextResponse.json(
      { error: "Enkel .eml-bestanden toegestaan" },
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
  const path = `zwerfkatten/${campaignId}/emails/${Date.now()}-${safeName}`;

  try {
    const blob = await put(path, file, { access: "public" });

    const inserted = await db
      .insert(strayCatCampaignAttachments)
      .values({
        campaignId,
        blobUrl: blob.url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || null,
        uploadedBy: session.email ?? null,
      })
      .returning({ id: strayCatCampaignAttachments.id });

    const attachmentId = inserted[0]?.id;

    await logAudit(
      "stray_cat_campaign.email_uploaded",
      "stray_cat_campaign",
      campaignId,
      null,
      { attachmentId, fileName: file.name, fileSize: file.size },
    );

    return NextResponse.json({
      success: true,
      data: { id: attachmentId, blobUrl: blob.url, fileName: file.name },
    });
  } catch (err) {
    console.error("upload-email failed:", err);
    return NextResponse.json(
      { error: "Mail uploaden mislukt. Probeer opnieuw." },
      { status: 500 },
    );
  }
}
