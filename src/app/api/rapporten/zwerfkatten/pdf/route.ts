import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requirePermission } from "@/lib/permissions";
import { getCampaignReport } from "@/lib/queries/stray-cat-campaigns";
import { getMunicipalityLogoByName } from "@/lib/queries/municipality-logos";
import StrayCatCampaignsPdf from "@/components/beheerder/rapporten/StrayCatCampaignsPdf";
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
    const rawMunicipality = params.get("gemeente") || undefined;

    const dateFrom = rawFrom && datePattern.test(rawFrom) ? rawFrom : undefined;
    const dateTo = rawTo && datePattern.test(rawTo) ? rawTo : undefined;

    const [{ campaigns, stats }, logo] = await Promise.all([
      getCampaignReport({
        municipality: rawMunicipality,
        dateFrom,
        dateTo,
      }),
      rawMunicipality ? getMunicipalityLogoByName(rawMunicipality) : Promise.resolve(null),
    ]);

    // Pre-fetch het logo en geef als data-URL door — @react-pdf/renderer kan
    // remote URLs niet altijd betrouwbaar laden in de server-context, een data-URL
    // werkt overal. SVG's slaan we over (niet ondersteund door <Image>).
    let logoDataUrl: string | undefined;
    if (logo?.logoUrl) {
      try {
        const url = new URL(logo.logoUrl);
        const ext = url.pathname.toLowerCase();
        if (/\.(png|jpe?g|webp)$/.test(ext)) {
          const res = await fetch(logo.logoUrl);
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const mime = res.headers.get("content-type") ?? "image/png";
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            logoDataUrl = `data:${mime};base64,${base64}`;
          }
        }
      } catch (err) {
        console.error("logo fetch failed:", err);
      }
    }

    const generatedAt = new Date().toLocaleDateString("nl-BE", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(StrayCatCampaignsPdf, {
      campaigns,
      stats,
      municipality: rawMunicipality,
      dateFrom,
      dateTo,
      logoUrl: logoDataUrl,
      generatedAt,
    }) as any;
    const buffer = await renderToBuffer(element);

    const dateStr = new Date().toISOString().split("T")[0];
    const safeMunicipality = rawMunicipality?.replace(/[^a-zA-Z0-9_-]/g, "_") ?? "alle";
    const filename = `R14-zwerfkatten-${safeMunicipality}-${dateStr}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed (zwerfkatten):", err);
    return new Response("Er ging iets mis bij het genereren van de PDF.", { status: 500 });
  }
}
