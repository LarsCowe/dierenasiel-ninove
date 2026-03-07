"use client";

import { useActionState } from "react";
import { deleteVetVisit, completeVetVisit } from "@/lib/actions/vet-visits";
import type { VetVisit } from "@/types";

const LOCATION_LABELS: Record<string, string> = {
  in_asiel: "In asiel",
  in_praktijk: "In praktijk",
};

interface VetVisitListProps {
  visits: VetVisit[];
}

export default function VetVisitList({ visits }: VetVisitListProps) {
  if (visits.length === 0) {
    return <p className="text-sm text-gray-500">Nog geen dierenarts-bezoeken geregistreerd.</p>;
  }

  return (
    <div className="space-y-2">
      {visits.map((v) => (
        <VetVisitRow key={v.id} visit={v} />
      ))}
    </div>
  );
}

function VetVisitRow({ visit }: { visit: VetVisit }) {
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteVetVisit, null);
  const [completeState, completeAction, isCompleting] = useActionState(completeVetVisit, null);

  const borderColor = visit.isCompleted ? "border-emerald-200" : "border-amber-200";
  const bgColor = visit.isCompleted ? "bg-emerald-50/50" : "bg-amber-50/50";

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} px-3 py-2.5`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              visit.isCompleted
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}>
              {LOCATION_LABELS[visit.location] ?? visit.location}
            </span>
            <span className="text-sm font-medium text-gray-800">{visit.date}</span>
            {visit.isCompleted ? (
              <span className="text-xs text-emerald-600">Afgerond</span>
            ) : (
              <span className="text-xs font-semibold text-amber-700">Openstaand</span>
            )}
          </div>
          {visit.diagnosis && (
            <p className="text-xs text-gray-700">
              <span className="font-semibold">Diagnose:</span> {visit.diagnosis}
            </p>
          )}
          {visit.complaints && (
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Klachten:</span> {visit.complaints}
            </p>
          )}
          {visit.todo && (
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Todo:</span> {visit.todo}
            </p>
          )}
          {visit.notes && (
            <p className="text-xs text-gray-500">{visit.notes}</p>
          )}
          {visit.isCompleted && visit.completedAt && (
            <p className="text-xs text-emerald-600">
              Afgerond op: {new Date(visit.completedAt).toLocaleDateString("nl-BE")}
            </p>
          )}
          {deleteState && !deleteState.success && (
            <p className="text-xs text-red-600">{deleteState.error}</p>
          )}
          {completeState && !completeState.success && (
            <p className="text-xs text-red-600">{completeState.error}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {!visit.isCompleted && (
            <form action={completeAction}>
              <input type="hidden" name="id" value={visit.id} />
              <input type="hidden" name="isCompleted" value="true" />
              <button
                type="submit"
                disabled={isCompleting}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
              >
                {isCompleting ? "..." : "Afronden"}
              </button>
            </form>
          )}
          <form action={deleteAction}>
            <input type="hidden" name="id" value={visit.id} />
            <button
              type="submit"
              disabled={isDeleting}
              className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              {isDeleting ? "..." : "Verwijderen"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
