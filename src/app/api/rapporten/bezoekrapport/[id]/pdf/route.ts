import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requirePermission } from "@/lib/permissions";
import { getVetInspectionReportById } from "@/lib/queries/vet-inspection-reports";
import InspectionReportPdf from "@/components/beheerder/medisch/InspectionReportPdf";
import { createElement } from "react";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const permCheck = await requirePermission("medical:read");
  if (permCheck && !permCheck.success) {
    return new Response("Onvoldoende rechten", { status: 403 });
  }

  const { id } = await params;
  const reportId = parseInt(id, 10);
  if (isNaN(reportId)) {
    return new Response("Ongeldig rapport-ID", { status: 400 });
  }

  const report = await getVetInspectionReportById(reportId);
  if (!report) {
    return new Response("Rapport niet gevonden", { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(InspectionReportPdf, { report }) as any;
  const buffer = await renderToBuffer(element);

  const safeName = report.vetName.replace(/[^a-zA-Z0-9\-_\s]/g, "").replace(/\s+/g, "_");
  const filename = `bezoekrapport-${report.visitDate}-${safeName}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
