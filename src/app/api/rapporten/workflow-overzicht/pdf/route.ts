import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requirePermission } from "@/lib/permissions";
import { getWorkflowOverviewReport } from "@/lib/queries/reports";
import { SPECIES_LABELS } from "@/lib/constants";
import { WORKFLOW_PHASES } from "@/lib/workflow/phases";
import WorkflowOverviewPdf from "@/components/beheerder/rapporten/WorkflowOverviewPdf";
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
    const rawSpecies = params.get("soort") || undefined;
    const rawPhase = params.get("fase") || undefined;

    const dateFrom = rawFrom && datePattern.test(rawFrom) ? rawFrom : undefined;
    const dateTo = rawTo && datePattern.test(rawTo) ? rawTo : undefined;
    const validSpecies = Object.keys(SPECIES_LABELS);
    const species = rawSpecies && validSpecies.includes(rawSpecies) ? rawSpecies : undefined;
    const workflowPhase = rawPhase && (WORKFLOW_PHASES as readonly string[]).includes(rawPhase) ? rawPhase : undefined;

    const { animals } = await getWorkflowOverviewReport({
      dateFrom,
      dateTo,
      species,
      workflowPhase,
    });

    const filterParts: string[] = [];
    if (species) filterParts.push(`Soort: ${species}`);
    if (workflowPhase) filterParts.push(`Fase: ${workflowPhase}`);
    if (dateFrom) filterParts.push(`Van: ${dateFrom}`);
    if (dateTo) filterParts.push(`Tot: ${dateTo}`);
    const filtersText = filterParts.length > 0 ? filterParts.join(", ") : undefined;

    const generatedAt = new Date().toLocaleDateString("nl-BE", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(WorkflowOverviewPdf, { animals, filters: filtersText, generatedAt }) as any;
    const buffer = await renderToBuffer(element);

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `workflow-overzicht-${dateStr}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed (workflow-overzicht):", err);
    return new Response("Er ging iets mis bij het genereren van de PDF.", { status: 500 });
  }
}
