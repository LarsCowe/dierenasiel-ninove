import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 200);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "Geen bestand geselecteerd" },
      { status: 400 },
    );
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Alleen afbeelding bestanden toegestaan (JPEG, PNG, WebP)" },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Bestand te groot (max 5MB)" },
      { status: 400 },
    );
  }

  const timestamp = Date.now();
  const safeName = sanitizeFileName(file.name);
  const path = `walkers/photos/${timestamp}-${safeName}`;

  try {
    const blob = await put(path, file, { access: "public" });
    return NextResponse.json({ success: true, url: blob.url });
  } catch {
    return NextResponse.json(
      { error: "Foto uploaden mislukt. Probeer opnieuw." },
      { status: 500 },
    );
  }
}
