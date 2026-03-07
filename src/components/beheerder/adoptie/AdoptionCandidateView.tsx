"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  deleteAdoptionCandidate,
  setCategoryAdoptionCandidate,
  updateStatusAdoptionCandidate,
} from "@/lib/actions/adoption-candidates";
import type { AdoptionCandidate } from "@/types";

interface Props {
  candidate: AdoptionCandidate;
  animalName?: string;
  kennismakingenSlot?: React.ReactNode;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Nieuw",
  screening: "Screening",
  approved: "Goedgekeurd",
  rejected: "Afgewezen",
  adopted: "Geadopteerd",
};

const CATEGORY_CONFIG: Record<string, { label: string; className: string; selectedClassName: string }> = {
  niet_weerhouden: {
    label: "Niet weerhouden",
    className: "border-red-300 text-red-700 hover:bg-red-50",
    selectedClassName: "bg-red-100 border-red-400 text-red-800 ring-2 ring-red-300",
  },
  mogelijks: {
    label: "Mogelijks",
    className: "border-amber-300 text-amber-700 hover:bg-amber-50",
    selectedClassName: "bg-amber-100 border-amber-400 text-amber-800 ring-2 ring-amber-300",
  },
  goede_kandidaat: {
    label: "Goede kandidaat",
    className: "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
    selectedClassName: "bg-emerald-100 border-emerald-400 text-emerald-800 ring-2 ring-emerald-300",
  },
};

export default function AdoptionCandidateView({ candidate, animalName, kennismakingenSlot }: Props) {
  const router = useRouter();
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAdoptionCandidate, null);
  const [categoryState, categoryAction, categoryPending] = useActionState(setCategoryAdoptionCandidate, null);
  const [statusState, statusAction, statusPending] = useActionState(updateStatusAdoptionCandidate, null);
  const qa = candidate.questionnaireAnswers as Record<string, unknown> | null;
  const canDelete = candidate.status === "pending" || candidate.status === "screening";

  useEffect(() => {
    if (deleteState?.success) {
      router.push("/beheerder/adoptie");
    }
  }, [deleteState, router]);

  useEffect(() => {
    if (categoryState?.success || statusState?.success) {
      router.refresh();
    }
  }, [categoryState, statusState, router]);

  return (
    <div className="space-y-6">
      {/* Status & actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            candidate.status === "approved" ? "bg-emerald-100 text-emerald-800" :
            candidate.status === "rejected" ? "bg-red-100 text-red-800" :
            candidate.status === "adopted" ? "bg-purple-100 text-purple-800" :
            candidate.status === "pending" ? "bg-blue-100 text-blue-800" :
            "bg-amber-100 text-amber-800"
          }`}>
            {STATUS_LABELS[candidate.status] ?? candidate.status}
          </span>
          {candidate.category && (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              CATEGORY_CONFIG[candidate.category]?.selectedClassName || "bg-gray-100 text-gray-800"
            }`}>
              {CATEGORY_CONFIG[candidate.category]?.label ?? candidate.category}
            </span>
          )}
        </div>
        {canDelete && (
          <form action={deleteAction}>
            <input type="hidden" name="id" value={candidate.id} />
            <button
              type="submit"
              disabled={deletePending}
              onClick={(e) => {
                if (!confirm("Weet je zeker dat je deze kandidaat wilt verwijderen?")) e.preventDefault();
              }}
              className="rounded-md border border-red-300 px-4 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {deletePending ? "Verwijderen..." : "Verwijderen"}
            </button>
          </form>
        )}
      </div>

      {candidate.blacklistMatch && (
        <div className="rounded-xl border-2 border-red-400 bg-red-50 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">&#9873;</span>
            <h2 className="font-heading text-sm font-bold text-red-800">Zwarte lijst — overeenkomst gevonden</h2>
          </div>
          <p className="mt-1 text-sm text-red-700">
            Deze kandidaat komt overeen met een item op de zwarte lijst. Controleer de gegevens
            voordat u verdergaat met het adoptieproces.
          </p>
        </div>
      )}

      {deleteState && !deleteState.success && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{deleteState.error}</p>
        </div>
      )}

      {categoryState && !categoryState.success && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{categoryState.error}</p>
        </div>
      )}

      {statusState && !statusState.success && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{statusState.error}</p>
        </div>
      )}

      {/* Categorie selectie */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Categorie</h2>
        {candidate.categorySetBy && (
          <p className="mt-1 text-xs text-gray-400">Ingesteld door {candidate.categorySetBy}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(CATEGORY_CONFIG).map(([value, config]) => {
            const isSelected = candidate.category === value;
            return (
              <form key={value} action={categoryAction}>
                <input type="hidden" name="json" value={JSON.stringify({ id: candidate.id, category: value })} />
                <button
                  type="submit"
                  disabled={categoryPending}
                  className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                    isSelected ? config.selectedClassName : config.className
                  }`}
                >
                  {config.label}
                </button>
              </form>
            );
          })}
        </div>
      </div>

      {/* Status acties */}
      {candidate.category === "niet_weerhouden" && candidate.status !== "rejected" && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 shadow-sm">
          <h2 className="font-heading text-sm font-bold text-red-800">Kandidaat niet weerhouden</h2>
          <p className="mt-1 text-sm text-red-700">Deze kandidaat komt niet in aanmerking voor adoptie.</p>
          <form action={statusAction} className="mt-3">
            <input type="hidden" name="json" value={JSON.stringify({ id: candidate.id, status: "rejected" })} />
            <button
              type="submit"
              disabled={statusPending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {statusPending ? "Afwijzen..." : "Afwijzen"}
            </button>
          </form>
        </div>
      )}

      {candidate.category === "goede_kandidaat" && candidate.status !== "approved" && candidate.status !== "adopted" && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <h2 className="font-heading text-sm font-bold text-emerald-800">Goede kandidaat</h2>
          <p className="mt-1 text-sm text-emerald-700">Plan een kennismaking met deze kandidaat.</p>
          <Link
            href={`/beheerder/adoptie/${candidate.id}/kennismaking`}
            className="mt-3 inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Kennismaking plannen
          </Link>
        </div>
      )}

      {candidate.status === "approved" && (
        <div className="rounded-xl border border-purple-100 bg-purple-50 p-5 shadow-sm">
          <h2 className="font-heading text-sm font-bold text-purple-800">Goedgekeurd voor adoptie</h2>
          <p className="mt-1 text-sm text-purple-700">Deze kandidaat is goedgekeurd. Maak het adoptiecontract op.</p>
          <Link
            href={`/beheerder/adoptie/${candidate.id}/contract`}
            className="mt-3 inline-block rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Contract opmaken
          </Link>
        </div>
      )}

      {/* Persoonlijke gegevens */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Persoonlijke gegevens</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-gray-500">Naam</p>
            <p className="text-sm font-semibold text-gray-800">{candidate.firstName} {candidate.lastName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">E-mailadres</p>
            <p className="text-sm font-semibold text-gray-800">{candidate.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Telefoon</p>
            <p className="text-sm text-gray-800">{candidate.phone || "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Adres</p>
            <p className="text-sm text-gray-800">{candidate.address || "-"}</p>
          </div>
        </div>
      </div>

      {/* Gewenst dier */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Gewenst dier</h2>
        <div className="mt-3">
          {candidate.animalId ? (
            <Link href={`/beheerder/dieren/${candidate.animalId}`} className="text-sm font-medium text-emerald-700 hover:text-emerald-900">
              {animalName ? `${animalName} — Bekijk dierprofiel` : `Bekijk dierprofiel (ID: ${candidate.animalId})`}
            </Link>
          ) : (
            <DierInfo candidate={candidate} />
          )}
        </div>
      </div>

      {/* Kennismakingen (direct onder gewenst dier) */}
      {kennismakingenSlot}

      {/* Vragenlijst */}
      {qa && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-heading text-sm font-bold text-[#1b4332]">Vragenlijst</h2>
          <div className="mt-3 space-y-3">
            <QuestionnaireDisplay data={qa as Record<string, unknown>} />
          </div>
        </div>
      )}

      {/* Notities */}
      {candidate.notes && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-heading text-sm font-bold text-[#1b4332]">Interne notities</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{candidate.notes}</p>
        </div>
      )}

    </div>
  );
}

// --- Dynamic questionnaire display ---

const QUESTION_LABELS: Record<string, string> = {
  // Shared
  woonsituatie: "Woonsituatie",
  tuinOmheind: "Tuin omheind",
  eerderHuisdieren: "Eerder huisdieren gehad",
  huidigeHuisdieren: "Huidige huisdieren",
  kinderenInHuis: "Kinderen in huis",
  werkSituatie: "Werksituatie",
  uurAlleen: "Uren alleen per dag",
  ervaring: "Ervaring met dieren",
  motivatie: "Motivatie",
  opmerkingen: "Opmerkingen",
  // Cat form
  andereHuisdieren: "Andere huisdieren aanwezig",
  binnenBuiten: "Binnenkat / buiten",
  voorkeurLeeftijd: "Voorkeur leeftijd",
  woningType: "Type woning",
  eigenaarHuurder: "Eigenaar of huurder",
  huurderDierenToegestaan: "Huurder: dieren toegestaan",
  kinderen: "Kinderen/huisgenoten in het gezin",
  beschikbareDagen: "Beschikbare dagen",
  adoptieVoorzien: "Adoptie voorzien voor",
  // Dog form
  tuinAanwezig: "Tuin aanwezig",
  tuinGrootte: "Grootte tuin",
  omheiningMateriaal: "Materiaal omheining",
  omheiningHoogte: "Hoogte omheining",
  beseftVerantwoordelijkheid: "Beseft verantwoordelijkheid (10+ jaar)",
  ervaringDieren: "Ervaring met dieren",
  ervaringBeschrijving: "Ervaring beschrijving",
  huidigeDieren: "Huidige dieren op verblijfplaats",
  urenAlleen: "Uren per dag alleen",
  verblijfplaats: "Verblijfplaats hond",
  bewegingsbehoefte: "Bewegingsbehoefte",
  vakanties: "Oplossing tijdens vakanties",
  bereidOpleiding: "Bereid opleiding te volgen",
  welkeOpleiding: "Welke opleiding",
  adviesProbleemgedrag: "Advies bij probleemgedrag",
  verzekering: "Familiale verzekering",
  extraInfo: "Extra info",
  // Meta
  geboortedatum: "Geboortedatum adoptant",
  bron: "Bron",
};

const VALUE_LABELS: Record<string, Record<string, string>> = {
  woonsituatie: { huis_met_tuin: "Huis met tuin", appartement: "Appartement", boerderij: "Boerderij", andere: "Andere" },
  werkSituatie: { voltijds_thuis: "Voltijds thuis", deeltijds: "Deeltijds", voltijds_buitenshuis: "Voltijds buitenshuis" },
  kinderenInHuis: { geen: "Geen kinderen", "0_5": "0-5 jaar", "6_12": "6-12 jaar", "12_plus": "12+ jaar" },
  bron: { publiek_formulier: "Publiek formulier (website)" },
};

const HIDDEN_KEYS = new Set(["fotoUrls"]);

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Ja" : "Nee";
  if (Array.isArray(value)) return value.join(", ");
  const str = String(value);
  return VALUE_LABELS[key]?.[str] ?? str;
}

function QuestionnaireDisplay({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([key]) => !HIDDEN_KEYS.has(key));
  const fotoUrls = data.fotoUrls as string[] | undefined;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className={`rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2 ${Array.isArray(value) || (typeof value === "string" && value.length > 80) ? "sm:col-span-2" : ""}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-[#1b4332]">
              {QUESTION_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-gray-900">
              {formatValue(key, value)}
            </p>
          </div>
        ))}
      </div>

      {fotoUrls && fotoUrls.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500">Foto&apos;s / video&apos;s verblijfplaats</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {fotoUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-gray-200 hover:ring-2 hover:ring-emerald-400">
                {url.match(/\.(mp4|mov|webm)/i) ? (
                  <video src={url} className="h-32 w-full object-cover" controls />
                ) : (
                  <img src={url} alt="Verblijfplaats" className="h-32 w-full object-cover" />
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function DierInfo({ candidate }: { candidate: AdoptionCandidate }) {
  const c = candidate as unknown as Record<string, unknown>;
  const requestedName = c.requestedAnimalName as string | undefined;
  const species = c.species as string | undefined;

  return (
    <div className="space-y-1">
      {requestedName ? (
        <p className="text-sm font-semibold text-gray-800">{requestedName}</p>
      ) : (
        <p className="text-sm text-gray-500">Geen dier opgegeven</p>
      )}
      {species && (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          {species === "hond" ? "Hond" : "Kat"}
        </span>
      )}
    </div>
  );
}
