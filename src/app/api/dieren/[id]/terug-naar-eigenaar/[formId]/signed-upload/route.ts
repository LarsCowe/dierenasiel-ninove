import { put, del } from "@vercel/blob";
import { db } from "@/lib/db";
import { ownerReturnForms } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { getOwnerReturnForm } from "@/lib/queries/owner-return";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Story 10.64 — de getekende versie (scan of foto) van het formulier "Terug naar
 * eigenaar" opladen. Zelfde regels als bij de adoptiecontracten (10.20): pdf/png/
 * jpg/webp, max 10 MB, Vercel Blob. Een nieuwe upload vervangt de vorige.
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXT = ["pdf", "png", "jpg", "jpeg", "webp"] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; formId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  if (!hasPermission(session.role, "animal:write")) {
    return NextResponse.json({ error: "Onvoldoende rechten" }, { status: 403 });
  }

  const { id, formId } = await params;
  const animalId = Number(id);
  const formulierId = Number(formId);
  if (!Number.isInteger(animalId) || !Number.isInteger(formulierId)) {
    return NextResponse.json({ error: "Ongeldig ID" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Bestand is verplicht" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(ext as (typeof ALLOWED_EXT)[number])) {
    return NextResponse.json({ error: `Enkel ${ALLOWED_EXT.join(", ")} toegestaan` }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Bestand te groot (max 10MB)" }, { status: 400 });
  }

  const form = await getOwnerReturnForm(animalId, formulierId);
  if (!form) {
    return NextResponse.json({ error: "Formulier niet gevonden" }, { status: 404 });
  }

  const path = `owner-return-forms/${form.formNr}-${Date.now()}-getekend.${ext}`;

  try {
    const blob = await put(path, file, { access: "public" });

    await db
      .update(ownerReturnForms)
      .set({ signedDocumentUrl: blob.url, signedAt: new Date() })
      .where(eq(ownerReturnForms.id, formulierId));

    // De vorige scan is vervangen; laat ze niet achter in de opslag.
    if (form.signedDocumentUrl) {
      await del(form.signedDocumentUrl).catch((err) => console.error("oude scan verwijderen mislukt:", err));
    }

    await logAudit(
      "owner_return_form.signed_document_uploaded",
      "owner_return_form",
      formulierId,
      { signedDocumentUrl: form.signedDocumentUrl },
      { signedDocumentUrl: blob.url },
    );

    revalidatePath(`/beheerder/dieren/${animalId}`);
    revalidatePath(`/beheerder/dieren/${animalId}/terug-naar-eigenaar/${formulierId}`);

    return NextResponse.json({ success: true, data: { url: blob.url, fileName: file.name } });
  } catch (err) {
    console.error("owner-return signed-upload failed:", err);
    return NextResponse.json({ error: "Upload mislukt. Probeer opnieuw." }, { status: 500 });
  }
}
