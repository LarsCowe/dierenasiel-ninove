import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { getAllAdoptionCandidatesForExport } from "@/lib/queries/adoption-candidates";
import { computeReviewResult } from "@/lib/actions/adoption-reviews";
import { NextResponse } from "next/server";

const QUESTION_LABELS: Record<string, string> = {
  andereHuisdieren: "Andere huisdieren",
  binnenBuiten: "Binnenkat / buiten",
  voorkeurLeeftijd: "Voorkeur leeftijd",
  woningType: "Type woning",
  eigenaarHuurder: "Eigenaar / huurder",
  huurderDierenToegestaan: "Huurder: dieren toegestaan",
  kinderen: "Kinderen in gezin",
  beschikbareDagen: "Beschikbare dagen",
  adoptieVoorzien: "Adoptie voorzien",
  tuinAanwezig: "Tuin aanwezig",
  tuinOmheind: "Tuin omheind",
  tuinGrootte: "Grootte tuin",
  omheiningMateriaal: "Materiaal omheining",
  omheiningHoogte: "Hoogte omheining",
  beseftVerantwoordelijkheid: "Beseft verantwoordelijkheid",
  ervaringDieren: "Ervaring dieren",
  ervaringBeschrijving: "Ervaring beschrijving",
  huidigeDieren: "Huidige dieren",
  urenAlleen: "Uren alleen",
  verblijfplaats: "Verblijfplaats",
  bewegingsbehoefte: "Bewegingsbehoefte",
  vakanties: "Vakanties",
  bereidOpleiding: "Bereid opleiding",
  welkeOpleiding: "Welke opleiding",
  adviesProbleemgedrag: "Advies probleemgedrag",
  verzekering: "Verzekering",
  extraInfo: "Extra info",
  geboortedatum: "Geboortedatum",
  woonsituatie: "Woonsituatie",
  werkSituatie: "Werksituatie",
  uurAlleen: "Uren alleen",
  ervaring: "Ervaring",
  motivatie: "Motivatie",
  opmerkingen: "Opmerkingen",
  eerderHuisdieren: "Eerder huisdieren",
  huidigeHuisdieren: "Huidige huisdieren",
  kinderenInHuis: "Kinderen in huis",
  tuinOmheindBool: "Tuin omheind",
  bron: "Bron",
};

const REVIEW_LABELS: Record<string, string> = {
  geschikt: "Geschikt",
  niet_weerhouden: "Niet weerhouden",
};

const RESULT_LABELS: Record<string, string> = {
  geschikt: "Geschikt",
  niet_weerhouden: "Niet weerhouden",
  misschien: "Misschien",
};

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "boolean") return val ? "Ja" : "Nee";
  if (Array.isArray(val)) return val.join("; ");
  return String(val);
}

export async function GET() {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "adoption:read")) {
    return NextResponse.json({ error: "Niet gemachtigd" }, { status: 403 });
  }

  const candidates = await getAllAdoptionCandidatesForExport();

  // Collect all unique questionnaire keys across all candidates
  const allQKeys = new Set<string>();
  for (const c of candidates) {
    const qa = c.questionnaireAnswers as Record<string, unknown> | null;
    if (qa) {
      for (const key of Object.keys(qa)) {
        if (key !== "fotoUrls" && key !== "bron") allQKeys.add(key);
      }
    }
  }
  const qKeys = Array.from(allQKeys);

  // Build header row
  const headers = [
    "ID",
    "Voornaam",
    "Achternaam",
    "Email",
    "Telefoon",
    "Adres",
    "Dier",
    "Soort",
    "Status",
    "Categorie",
    "Datum",
    ...qKeys.map((k) => QUESTION_LABELS[k] || k),
    "Beoordeling Martine",
    "Beoordeling Nathalie",
    "Beoordeling Sven",
    "Resultaat",
  ];

  const rows = candidates.map((c) => {
    const qa = (c.questionnaireAnswers as Record<string, unknown>) || {};
    const result = computeReviewResult(c.reviewMartine, c.reviewNathalie, c.reviewSven);

    return [
      String(c.id),
      c.firstName,
      c.lastName,
      c.email,
      c.phone || "",
      c.address || "",
      c.animalName || "",
      c.species || "",
      c.status,
      c.category || "",
      new Date(c.createdAt).toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " + new Date(c.createdAt).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" }),
      ...qKeys.map((k) => formatValue(qa[k])),
      REVIEW_LABELS[c.reviewMartine || ""] || "",
      REVIEW_LABELS[c.reviewNathalie || ""] || "",
      REVIEW_LABELS[c.reviewSven || ""] || "",
      RESULT_LABELS[result || ""] || "",
    ];
  });

  // BOM for Excel UTF-8 support
  const bom = "\uFEFF";
  const csv = bom + [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="adoptie-aanvragen-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
