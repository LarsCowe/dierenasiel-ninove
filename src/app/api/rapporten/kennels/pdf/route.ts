import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requirePermission } from "@/lib/permissions";
import { getKennelOccupancyReport } from "@/lib/queries/reports";
import KennelOccupancyPdf from "@/components/beheerder/rapporten/KennelOccupancyPdf";
import { createElement } from "react";

export async function GET(request: NextRequest) {
  const permCheck = await requirePermission("report:generate");
  if (permCheck && !permCheck.success) {
    return new Response("Onvoldoende rechten", { status: 403 });
  }

  try {
    const params = request.nextUrl.searchParams;
    const zone = params.get("zone") || undefined;

    const { kennels } = await getKennelOccupancyReport({ zone });

    const filterParts: string[] = [];
    if (zone) filterParts.push(`Zone: ${zone}`);
    const filtersText = filterParts.length > 0 ? filterParts.join(", ") : undefined;

    const generatedAt = new Date().toLocaleDateString("nl-BE", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(KennelOccupancyPdf, { kennels, filters: filtersText, generatedAt }) as any;
    const buffer = await renderToBuffer(element);

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `kennelbezetting-${dateStr}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed (kennels):", err);
    return new Response("Er ging iets mis bij het genereren van de PDF.", { status: 500 });
  }
}
