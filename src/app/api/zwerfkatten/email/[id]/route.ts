import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { strayCatCampaignAttachments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
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
  const attachmentId = Number(id);
  if (!attachmentId || isNaN(attachmentId)) {
    return NextResponse.json({ error: "Ongeldig ID" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(strayCatCampaignAttachments)
    .where(eq(strayCatCampaignAttachments.id, attachmentId))
    .limit(1);

  const attachment = rows[0];
  if (!attachment) {
    return NextResponse.json({ error: "Mail niet gevonden" }, { status: 404 });
  }

  try {
    await del(attachment.blobUrl);
  } catch {
    // Best-effort: weeshouder-blob is acceptabel.
  }

  await db
    .delete(strayCatCampaignAttachments)
    .where(eq(strayCatCampaignAttachments.id, attachmentId));

  await logAudit(
    "stray_cat_campaign.email_deleted",
    "stray_cat_campaign",
    attachment.campaignId,
    { fileName: attachment.fileName, blobUrl: attachment.blobUrl },
    null,
  );

  return NextResponse.json({ success: true });
}
