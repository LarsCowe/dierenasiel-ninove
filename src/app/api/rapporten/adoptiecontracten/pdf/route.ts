import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requirePermission } from "@/lib/permissions";
import { getAdoptionContractsReport } from "@/lib/queries/reports";
import AdoptionContractsPdf from "@/components/beheerder/rapporten/AdoptionContractsPdf";
import { createElement } from "react";

export async function GET(request: NextRequest) {
  const permCheck = await requirePermission("report:generate");
  if (permCheck && !permCheck.success) {
    return new Response("Onvoldoende rechten", { status: 403 });
  }

  try {
    const params = request.nextUrl.searchParams;
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    const validPaymentMethods = ["cash", "payconiq", "overschrijving"];

    const rawFrom = params.get("van") || undefined;
    const rawTo = params.get("tot") || undefined;
    const rawPayment = params.get("betaalwijze") || undefined;

    const dateFrom = rawFrom && datePattern.test(rawFrom) ? rawFrom : undefined;
    const dateTo = rawTo && datePattern.test(rawTo) ? rawTo : undefined;
    const paymentMethod = rawPayment && validPaymentMethods.includes(rawPayment) ? rawPayment : undefined;

    const { contracts } = await getAdoptionContractsReport({ dateFrom, dateTo, paymentMethod });

    const filterParts: string[] = [];
    if (dateFrom) filterParts.push(`Van: ${dateFrom}`);
    if (dateTo) filterParts.push(`Tot: ${dateTo}`);
    if (paymentMethod) filterParts.push(`Betaalwijze: ${paymentMethod}`);
    const filtersText = filterParts.length > 0 ? filterParts.join(", ") : undefined;

    const generatedAt = new Date().toLocaleDateString("nl-BE", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(AdoptionContractsPdf, { contracts, filters: filtersText, generatedAt }) as any;
    const buffer = await renderToBuffer(element);

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `adoptiecontracten-${dateStr}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed (adoptiecontracten):", err);
    return new Response("Er ging iets mis bij het genereren van de PDF.", { status: 500 });
  }
}
