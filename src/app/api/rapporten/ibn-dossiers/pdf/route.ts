import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requirePermission } from "@/lib/permissions";
import { getIBNDossiersReport } from "@/lib/queries/reports";
import IBNDossiersPdf from "@/components/beheerder/rapporten/IBNDossiersPdf";
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

    const deadlineFrom = rawFrom && datePattern.test(rawFrom) ? rawFrom : undefined;
    const deadlineTo = rawTo && datePattern.test(rawTo) ? rawTo : undefined;

    const { dossiers } = await getIBNDossiersReport({ deadlineFrom, deadlineTo });

    const filterParts: string[] = [];
    if (deadlineFrom) filterParts.push(`Deadline van: ${deadlineFrom}`);
    if (deadlineTo) filterParts.push(`Deadline tot: ${deadlineTo}`);
    const filtersText = filterParts.length > 0 ? filterParts.join(", ") : undefined;

    const generatedAt = new Date().toLocaleDateString("nl-BE", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(IBNDossiersPdf, { dossiers, filters: filtersText, generatedAt }) as any;
    const buffer = await renderToBuffer(element);

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `ibn-dossiers-${dateStr}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed (ibn-dossiers):", err);
    return new Response("Er ging iets mis bij het genereren van de PDF.", { status: 500 });
  }
}
