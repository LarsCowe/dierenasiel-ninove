"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteAdoptionCandidate } from "@/lib/actions/adoption-candidates";
import type { AdoptionCandidate, QuestionnaireAnswers } from "@/types";

interface Props {
  candidate: AdoptionCandidate;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Nieuw",
  screening: "Screening",
  approved: "Goedgekeurd",
  rejected: "Afgewezen",
  adopted: "Geadopteerd",
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

export default function AdoptionCandidateView({ candidate }: Props) {
  const router = useRouter();
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAdoptionCandidate, null);
  const qa = candidate.questionnaireAnswers as QuestionnaireAnswers | null;
  const canDelete = candidate.status === "pending" || candidate.status === "screening";

  useEffect(() => {
    if (deleteState?.success) {
      router.push("/beheerder/adoptie");
    }
  }, [deleteState, router]);

  return (
    <div className="space-y-6">
      {/* Status & actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
          candidate.status === "approved" ? "bg-emerald-100 text-emerald-800" :
          candidate.status === "rejected" ? "bg-red-100 text-red-800" :
          candidate.status === "adopted" ? "bg-purple-100 text-purple-800" :
          "bg-amber-100 text-amber-800"
        }`}>
          {STATUS_LABELS[candidate.status] ?? candidate.status}
        </span>
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

      {deleteState && !deleteState.success && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{deleteState.error}</p>
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
            Bekijk dierprofiel (ID: {candidate.animalId})
          </Link>
        </div>
      </div>

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
