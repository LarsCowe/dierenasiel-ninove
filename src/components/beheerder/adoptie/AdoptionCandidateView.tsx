"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  deleteAdoptionCandidate,
  setCategoryAdoptionCandidate,
  updateStatusAdoptionCandidate,
} from "@/lib/actions/adoption-candidates";
import type { AdoptionCandidate, QuestionnaireAnswers } from "@/types";

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

const WOONSITUATIE_LABELS: Record<string, string> = {
  huis_met_tuin: "Huis met tuin",
  appartement: "Appartement",
  boerderij: "Boerderij",
  andere: "Andere",
};

const WERKSITUATIE_LABELS: Record<string, string> = {
  voltijds_thuis: "Voltijds thuis",
  deeltijds: "Deeltijds",
  voltijds_buitenshuis: "Voltijds buitenshuis",
};

const KINDEREN_LABELS: Record<string, string> = {
  geen: "Geen kinderen",
  "0_5": "0-5 jaar",
  "6_12": "6-12 jaar",
  "12_plus": "12+ jaar",
};

export default function AdoptionCandidateView({ candidate, animalName, kennismakingenSlot }: Props) {
  const router = useRouter();
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAdoptionCandidate, null);
  const [categoryState, categoryAction, categoryPending] = useActionState(setCategoryAdoptionCandidate, null);
  const [statusState, statusAction, statusPending] = useActionState(updateStatusAdoptionCandidate, null);
  const qa = candidate.questionnaireAnswers as QuestionnaireAnswers | null;
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
          <Link href={`/beheerder/dieren/${candidate.animalId}`} className="text-sm font-medium text-emerald-700 hover:text-emerald-900">
            {animalName ? `${animalName} — Bekijk dierprofiel` : `Bekijk dierprofiel (ID: ${candidate.animalId})`}
          </Link>
        </div>
      </div>

      {/* Kennismakingen (direct onder gewenst dier) */}
      {kennismakingenSlot}

      {/* Vragenlijst */}
      {qa && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-heading text-sm font-bold text-[#1b4332]">Vragenlijst (Bijlage IX)</h2>
          <div className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-gray-500">Woonsituatie</p>
                <p className="text-sm text-gray-800">{WOONSITUATIE_LABELS[qa.woonsituatie] ?? qa.woonsituatie}</p>
              </div>
              {qa.tuinOmheind !== null && qa.tuinOmheind !== undefined && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Tuin omheind</p>
                  <p className="text-sm text-gray-800">{qa.tuinOmheind ? "Ja" : "Nee"}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-500">Eerder huisdieren</p>
                <p className="text-sm text-gray-800">{qa.eerderHuisdieren ? "Ja" : "Nee"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Huidige huisdieren</p>
                <p className="text-sm text-gray-800">{qa.huidigeHuisdieren || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Kinderen in huis</p>
                <p className="text-sm text-gray-800">{KINDEREN_LABELS[qa.kinderenInHuis] ?? qa.kinderenInHuis}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Werksituatie</p>
                <p className="text-sm text-gray-800">{WERKSITUATIE_LABELS[qa.werkSituatie] ?? qa.werkSituatie}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Uren alleen per dag</p>
                <p className="text-sm text-gray-800">{qa.uurAlleen || "-"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Ervaring met dieren</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{qa.ervaring || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Motivatie</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{qa.motivatie || "-"}</p>
            </div>
            {qa.opmerkingen && (
              <div>
                <p className="text-xs font-medium text-gray-500">Opmerkingen</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{qa.opmerkingen}</p>
              </div>
            )}
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

      {/* Datum */}
      <div className="text-xs text-gray-400">
        Aanvraag ingediend op {new Date(candidate.createdAt).toLocaleDateString("nl-BE")}
      </div>
    </div>
  );
}
