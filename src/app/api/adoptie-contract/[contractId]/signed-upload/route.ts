import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { adoptionContracts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXT = ["pdf", "png", "jpg", "jpeg", "webp"] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ contractId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  if (!hasPermission(session.role, "adoption:write")) {
    return NextResponse.json({ error: "Onvoldoende rechten" }, { status: 403 });
  }

  const { contractId: rawId } = await params;
  const contractId = Number(rawId);
  if (!contractId || isNaN(contractId)) {
    return NextResponse.json({ error: "Ongeldig contract-ID" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Bestand is verplicht" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(ext as typeof ALLOWED_EXT[number])) {
    return NextResponse.json(
      { error: `Enkel ${ALLOWED_EXT.join(", ")} toegestaan` },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Bestand te groot (max 10MB)" }, { status: 400 });
  }

  const [contract] = await db
    .select()
    .from(adoptionContracts)
    .where(eq(adoptionContracts.id, contractId))
    .limit(1);
  if (!contract) {
    return NextResponse.json({ error: "Contract niet gevonden" }, { status: 404 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
  const path = `adoption-contracts/${contractId}-${Date.now()}-${safeName}`;

  try {
    const blob = await put(path, file, { access: "public" });

    await db
      .update(adoptionContracts)
      .set({
        signedDocumentUrl: blob.url,
        signedAt: new Date(),
        signingMethod: "papier",
        status: "getekend",
      })
      .where(eq(adoptionContracts.id, contractId));

    await logAudit(
      "adoption_contract.signed_document_uploaded",
      "adoption_contract",
      contractId,
      { signedDocumentUrl: contract.signedDocumentUrl, status: contract.status },
      { signedDocumentUrl: blob.url, status: "getekend" },
    );

    revalidatePath("/beheerder/adoptie");
    revalidatePath(`/beheerder/adoptie/contracten/${contractId}`);

    return NextResponse.json({
      success: true,
      data: { url: blob.url, fileName: file.name },
    });
  } catch (err) {
    console.error("signed-upload failed:", err);
    return NextResponse.json(
      { error: "Upload mislukt. Probeer opnieuw." },
      { status: 500 },
    );
  }
}
