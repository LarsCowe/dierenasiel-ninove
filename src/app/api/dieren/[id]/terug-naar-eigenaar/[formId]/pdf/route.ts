import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getOwnerReturnForm } from "@/lib/queries/owner-return";
import { ownerReturnPdfFilename, renderOwnerReturnPdf } from "@/lib/animals/owner-return-document";

/**
 * Story 10.64 — het formulier "Terug naar eigenaar" als PDF, om af te drukken
 * en te laten tekenen. Zelfde opzet als de kennelkaart (10.43): het document
 * hangt aan het dier.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; formId: string }> },
) {
  const permCheck = await requirePermission("animal:read");
  if (permCheck && !permCheck.success) {
    return new Response("Onvoldoende rechten", { status: 403 });
  }

  const { id, formId } = await params;
  const animalId = parseInt(id, 10);
  const formulierId = parseInt(formId, 10);
  if (isNaN(animalId) || isNaN(formulierId)) {
    return new Response("Ongeldig ID", { status: 400 });
  }

  const form = await getOwnerReturnForm(animalId, formulierId);
  if (!form) {
    return new Response("Formulier niet gevonden", { status: 404 });
  }

  const buffer = await renderOwnerReturnPdf(form);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${ownerReturnPdfFilename(form.formNr)}"`,
      // Persoonsgegevens van de eigenaar: niet in een gedeelde of schijfcache laten staan.
      "Cache-Control": "private, no-store",
    },
  });
}
