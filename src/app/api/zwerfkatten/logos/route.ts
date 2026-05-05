import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { municipalityLogos } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { getMunicipalityLogoByName } from "@/lib/queries/municipality-logos";
import { NextResponse } from "next/server";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

const MAX_FILE_SIZE = 2 * 1024 * 1024;

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
  const rawName = (formData.get("name") as string | null)?.trim() ?? "";

  if (!file) {
    return NextResponse.json({ error: "Bestand is verplicht" }, { status: 400 });
  }
  if (!rawName) {
    return NextResponse.json({ error: "Gemeentenaam is verplicht" }, { status: 400 });
  }
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: "Ongeldig bestandstype. Toegestaan: PNG, JPEG, WebP, SVG." },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Bestand te groot (max 2MB)" }, { status: 400 });
  }

  const existing = await getMunicipalityLogoByName(rawName);
  if (existing) {
    return NextResponse.json(
      { error: "Een logo voor deze gemeente bestaat al" },
      { status: 400 },
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
  const path = `zwerfkatten/logos/${Date.now()}-${safeName}`;

  try {
    const blob = await put(path, file, { access: "public" });

    const inserted = await db
      .insert(municipalityLogos)
      .values({
        name: rawName,
        logoUrl: blob.url,
        uploadedBy: session.email ?? null,
      })
      .returning({ id: municipalityLogos.id });

    const id = inserted[0]?.id;

    await logAudit(
      "municipality_logo.created",
      "municipality_logo",
      id,
      null,
      { name: rawName, logoUrl: blob.url },
    );

    return NextResponse.json({ success: true, data: { id, name: rawName, logoUrl: blob.url } });
  } catch (err) {
    console.error("upload-logo failed:", err);
    return NextResponse.json(
      { error: "Logo uploaden mislukt. Probeer opnieuw." },
      { status: 500 },
    );
  }
}
