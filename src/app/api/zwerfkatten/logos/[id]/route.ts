import { put, del } from "@vercel/blob";
import { db } from "@/lib/db";
import { municipalityLogos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import {
  getMunicipalityLogoById,
  getMunicipalityLogoByName,
} from "@/lib/queries/municipality-logos";
import { NextResponse } from "next/server";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;
const MAX_FILE_SIZE = 2 * 1024 * 1024;

async function authorize() {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: "Niet ingelogd" }, { status: 401 }) };
  }
  if (!hasPermission(session.role, "stray_cat:write")) {
    return { ok: false as const, response: NextResponse.json({ error: "Onvoldoende rechten" }, { status: 403 }) };
  }
  return { ok: true as const, session };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const logoId = Number(id);
  if (!logoId || isNaN(logoId)) {
    return NextResponse.json({ error: "Ongeldig ID" }, { status: 400 });
  }

  const existing = await getMunicipalityLogoById(logoId);
  if (!existing) {
    return NextResponse.json({ error: "Logo niet gevonden" }, { status: 404 });
  }

  const formData = await request.formData();
  const newName = (formData.get("name") as string | null)?.trim() ?? "";
  const file = formData.get("file") as File | null;

  if (!newName) {
    return NextResponse.json({ error: "Gemeentenaam is verplicht" }, { status: 400 });
  }

  // Conflict check: another row with this name?
  if (newName.toLowerCase() !== existing.name.toLowerCase()) {
    const conflict = await getMunicipalityLogoByName(newName);
    if (conflict && conflict.id !== logoId) {
      return NextResponse.json(
        { error: "Een logo voor deze gemeente bestaat al" },
        { status: 400 },
      );
    }
  }

  const updateValues: { name: string; logoUrl?: string } = { name: newName };
  let oldBlobToDelete: string | null = null;

  if (file && file.size > 0) {
    if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { error: "Ongeldig bestandstype. Toegestaan: PNG, JPEG, WebP, SVG." },
        { status: 400 },
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Bestand te groot (max 2MB)" }, { status: 400 });
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
    const path = `zwerfkatten/logos/${Date.now()}-${safeName}`;
    try {
      const blob = await put(path, file, { access: "public" });
      updateValues.logoUrl = blob.url;
      oldBlobToDelete = existing.logoUrl;
    } catch (err) {
      console.error("logo replace upload failed:", err);
      return NextResponse.json(
        { error: "Logo bijwerken mislukt. Probeer opnieuw." },
        { status: 500 },
      );
    }
  }

  await db
    .update(municipalityLogos)
    .set(updateValues)
    .where(eq(municipalityLogos.id, logoId));

  if (oldBlobToDelete) {
    try {
      await del(oldBlobToDelete);
    } catch {
      // best-effort
    }
  }

  await logAudit(
    "municipality_logo.updated",
    "municipality_logo",
    logoId,
    { name: existing.name, logoUrl: existing.logoUrl },
    { name: newName, logoUrl: updateValues.logoUrl ?? existing.logoUrl },
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const logoId = Number(id);
  if (!logoId || isNaN(logoId)) {
    return NextResponse.json({ error: "Ongeldig ID" }, { status: 400 });
  }

  const existing = await getMunicipalityLogoById(logoId);
  if (!existing) {
    return NextResponse.json({ error: "Logo niet gevonden" }, { status: 404 });
  }

  try {
    await del(existing.logoUrl);
  } catch {
    // best-effort
  }

  await db.delete(municipalityLogos).where(eq(municipalityLogos.id, logoId));

  await logAudit(
    "municipality_logo.deleted",
    "municipality_logo",
    logoId,
    { name: existing.name, logoUrl: existing.logoUrl },
    null,
  );

  return NextResponse.json({ success: true });
}
