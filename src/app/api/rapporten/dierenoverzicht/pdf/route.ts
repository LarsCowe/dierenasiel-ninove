import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requirePermission } from "@/lib/permissions";
import { getAnimalReport } from "@/lib/queries/reports";
import AnimalReportPdf from "@/components/beheerder/rapporten/AnimalReportPdf";
import { createElement } from "react";

export async function GET(request: NextRequest) {
  const permCheck = await requirePermission("report:generate");
  if (permCheck && !permCheck.success) {
    return new Response("Onvoldoende rechten", { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const species = params.get("soort") || undefined;
  const status = params.get("status") || undefined;
  const kennelId = params.get("kennel") ? parseInt(params.get("kennel")!, 10) : undefined;
  const workflowPhase = params.get("fase") || undefined;

  const { animals } = await getAnimalReport({ species, status, kennelId, workflowPhase });

  const filterParts: string[] = [];
  if (species) filterParts.push(`Soort: ${species}`);
  if (status) filterParts.push(`Status: ${status}`);
  if (workflowPhase) filterParts.push(`Fase: ${workflowPhase}`);
  const filtersText = filterParts.length > 0 ? filterParts.join(", ") : undefined;

  const generatedAt = new Date().toLocaleDateString("nl-BE", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(AnimalReportPdf, { animals, filters: filtersText, generatedAt }) as any;
  const buffer = await renderToBuffer(element);

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `dierenoverzicht-${dateStr}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
