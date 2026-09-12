import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dewormings } from "@/lib/db/schema";
import { requirePermission } from "@/lib/permissions";
import { getAnimalById } from "@/lib/queries/animals";
import { buildBookletLabel } from "@/lib/animals/booklet-label";
import BookletLabelPdf from "@/components/beheerder/rapporten/BookletLabelPdf";

/**
 * Story 10.66 — DYMO-etiket voor achteraan in het boekje, per dier.
 *
 * Zelfde opzet als de kennelkaart (Story 10.43): het etiket hangt aan het dier.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permCheck = await requirePermission("animal:read");
  if (permCheck && !permCheck.success) {
    return new Response("Onvoldoende rechten", { status: 403 });
  }

  const { id } = await params;
  const animalId = parseInt(id, 10);
  if (isNaN(animalId)) {
    return new Response("Ongeldig dier-ID", { status: 400 });
  }

  const animal = await getAnimalById(animalId);
  if (!animal) {
    return new Response("Dier niet gevonden", { status: 404 });
  }

  // Alle antiparasitaire behandelingen; `buildBookletLabel` houdt enkel de
  // ontwormingen over (de vlooienbehandeling deelt de tabel sinds Story 10.31).
  const behandelingen = await db
    .select({ date: dewormings.date, type: dewormings.type, category: dewormings.category })
    .from(dewormings)
    .where(eq(dewormings.animalId, animalId))
    .orderBy(asc(dewormings.date));

  const etiket = buildBookletLabel({
    animal: {
      name: animal.name,
      identificationNr: animal.identificationNr,
      isNeutered: animal.isNeutered,
      neuteredByShelter: animal.neuteredByShelter,
      neuteredDate: animal.neuteredDate,
    },
    dewormings: behandelingen,
  });

  const element = createElement(BookletLabelPdf, { etiket });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);

  const bestandsnaam = `boekje-etiket-${animal.slug || animalId}.pdf`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${bestandsnaam}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
