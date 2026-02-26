import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { animalAttachments } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/validations/attachments";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const animalId = Number(formData.get("animalId"));
  const description = formData.get("description") as string | null;

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
  const path = `animals/${animalId}/${timestamp}-${file.name}`;

  const blob = await put(path, file, { access: "public" });

  const [attachment] = await db
    .insert(animalAttachments)
    .values({
      animalId,
      fileUrl: blob.url,
      fileName: file.name,
      fileType: file.type,
      description: description || undefined,
    })
    .returning();

  await logAudit("upload_attachment", "animal_attachment", attachment.id, null, attachment);

  return NextResponse.json({ success: true, data: attachment });
}
