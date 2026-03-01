import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requirePermission } from "@/lib/permissions";
import { getAdoptableAnimalsReport } from "@/lib/queries/reports";
import AdoptableAnimalsPdf from "@/components/beheerder/rapporten/AdoptableAnimalsPdf";
import { createElement } from "react";

export async function GET(request: NextRequest) {
  const permCheck = await requirePermission("report:generate");
  if (permCheck && !permCheck.success) {
    return new Response("Onvoldoende rechten", { status: 403 });
  }

  try {
    const params = request.nextUrl.searchParams;
    const species = params.get("soort") || undefined;

    const { animals } = await getAdoptableAnimalsReport({ species });

    const filterParts: string[] = [];
    if (species) filterParts.push(`Soort: ${species}`);
    const filtersText = filterParts.length > 0 ? filterParts.join(", ") : undefined;

    const generatedAt = new Date().toLocaleDateString("nl-BE", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(AdoptableAnimalsPdf, { animals, filters: filtersText, generatedAt }) as any;
    const buffer = await renderToBuffer(element);

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `te-adopteren-dieren-${dateStr}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed (adopteren):", err);
    return new Response("Er ging iets mis bij het genereren van de PDF.", { status: 500 });
  }
}
