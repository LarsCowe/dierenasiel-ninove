import { put, del } from "@vercel/blob";
import { db } from "@/lib/db";
import { animalAttachments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/validations/attachments";
import { NextResponse } from "next/server";

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 200);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const animalId = Number(formData.get("animalId"));
  const description = formData.get("description") as string | null;
  const context = (formData.get("context") as string) || "dossier";

  const requiredPermission = context === "verwaarlozing" ? "medical:write" : "animal:write";
  if (!hasPermission(session.role, requiredPermission)) {
    return NextResponse.json({ error: "Onvoldoende rechten" }, { status: 403 });
  }

  if (!file || !animalId) {
    return NextResponse.json(
      { error: "Bestand en dier-ID zijn verplicht" },
      { status: 400 },
    );
  }

  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: "Ongeldig bestandstype. Toegestaan: afbeeldingen, video's en PDF." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Bestand te groot (max 50MB)" },
      { status: 400 },
    );
  }

  const timestamp = Date.now();
  const safeName = sanitizeFileName(file.name);
  const path = `animals/${animalId}/${timestamp}-${safeName}`;

  let blob: { url: string };
  try {
    blob = await put(path, file, { access: "public" });
  } catch {
    return NextResponse.json(
      { error: "Bestand uploaden mislukt. Probeer opnieuw." },
      { status: 500 },
    );
  }

  try {
    const [attachment] = await db
      .insert(animalAttachments)
      .values({
        animalId,
        fileUrl: blob.url,
        fileName: file.name,
        fileType: file.type,
        context,
        description: description || undefined,
      })
      .returning();

    await logAudit("upload_attachment", "animal_attachment", attachment.id, null, attachment);

    return NextResponse.json({ success: true, data: attachment });
  } catch {
    // DB insert failed — clean up orphaned blob
    try {
      await del(blob.url);
    } catch {
      // Best effort cleanup
    }
    return NextResponse.json(
      { error: "Bijlage opslaan mislukt. Probeer opnieuw." },
      { status: 500 },
    );
  }
}
