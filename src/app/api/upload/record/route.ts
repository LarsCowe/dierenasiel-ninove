import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { animalAttachments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

/**
 * POST /api/upload/record
 *
 * Records a completed client-upload in the database.
 * Called by the browser after a successful Vercel Blob client upload.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const body = await request.json();
  const { blobUrl, fileName, fileType, animalId, context, description, followupId } = body as {
    blobUrl: string;
    fileName: string;
    fileType: string;
    animalId: number;
    context?: string;
    description?: string;
    followupId?: number;
  };

  if (!blobUrl || !fileName || !fileType || !animalId) {
    return NextResponse.json(
      { error: "blobUrl, fileName, fileType en animalId zijn verplicht" },
      { status: 400 },
    );
  }

  const ctx = context || "dossier";
  const requiredPermission =
    ctx === "verwaarlozing"
      ? "medical:write"
      : ctx === "post_adoptie"
        ? "adoption:write"
        : "animal:write";

  if (!hasPermission(session.role, requiredPermission)) {
    return NextResponse.json({ error: "Onvoldoende rechten" }, { status: 403 });
  }

  try {
    const [attachment] = await db
      .insert(animalAttachments)
      .values({
        animalId,
        fileUrl: blobUrl,
        fileName,
        fileType,
        context: ctx,
        description: description || undefined,
        followupId: followupId || undefined,
      })
      .returning();

    await logAudit("upload_attachment", "animal_attachment", attachment.id, null, attachment);

    return NextResponse.json({ success: true, data: attachment });
  } catch {
    // DB insert failed — clean up orphaned blob
    try {
      await del(blobUrl);
    } catch {
      // Best effort cleanup
    }
    return NextResponse.json(
      { error: "Bijlage opslaan mislukt. Probeer opnieuw." },
      { status: 500 },
    );
  }
}
