import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requirePermission } from "@/lib/permissions";
import { getWalkActivityReport } from "@/lib/queries/reports";
import WalkActivityPdf from "@/components/beheerder/rapporten/WalkActivityPdf";
import { createElement } from "react";

export async function GET(request: NextRequest) {
  const permCheck = await requirePermission("report:generate");
  if (permCheck && !permCheck.success) {
    return new Response("Onvoldoende rechten", { status: 403 });
  }

  try {
    const params = request.nextUrl.searchParams;
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    const rawFrom = params.get("van") || undefined;
    const rawTo = params.get("tot") || undefined;
    const rawWalker = params.get("wandelaar") || undefined;
    const rawAnimal = params.get("dier") || undefined;

    const dateFrom = rawFrom && datePattern.test(rawFrom) ? rawFrom : undefined;
    const dateTo = rawTo && datePattern.test(rawTo) ? rawTo : undefined;
    const walkerId = rawWalker ? parseInt(rawWalker, 10) : undefined;
    const animalId = rawAnimal ? parseInt(rawAnimal, 10) : undefined;

    const { walks } = await getWalkActivityReport({
      dateFrom,
      dateTo,
      walkerId: walkerId && !isNaN(walkerId) && walkerId > 0 ? walkerId : undefined,
      animalId: animalId && !isNaN(animalId) && animalId > 0 ? animalId : undefined,
    });

    const filterParts: string[] = [];
    if (dateFrom) filterParts.push(`Van: ${dateFrom}`);
    if (dateTo) filterParts.push(`Tot: ${dateTo}`);
    if (walkerId && !isNaN(walkerId) && walkerId > 0) filterParts.push(`Wandelaar: ${walkerId}`);
    if (animalId && !isNaN(animalId) && animalId > 0) filterParts.push(`Dier: ${animalId}`);
    const filtersText = filterParts.length > 0 ? filterParts.join(", ") : undefined;

    const generatedAt = new Date().toLocaleDateString("nl-BE", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(WalkActivityPdf, { walks, filters: filtersText, generatedAt }) as any;
    const buffer = await renderToBuffer(element);

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `wandelactiviteit-${dateStr}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed (wandelactiviteit):", err);
    return new Response("Er ging iets mis bij het genereren van de PDF.", { status: 500 });
  }
}
