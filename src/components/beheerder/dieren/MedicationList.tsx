"use client";

import { useActionState } from "react";
import { deleteMedication, stopMedication } from "@/lib/actions/medications";
import type { Medication } from "@/types";

interface MedicationListProps {
  medications: Medication[];
}

export default function MedicationList({ medications }: MedicationListProps) {
  if (medications.length === 0) {
    return <p className="text-sm text-gray-500">Nog geen medicatie voorgeschreven.</p>;
  }

  return (
    <div className="space-y-2">
      {medications.map((med) => (
        <MedicationRow key={med.id} medication={med} />
      ))}
    </div>
  );
}

function MedicationRow({ medication }: { medication: Medication }) {
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteMedication, null);
  const [stopState, stopAction, isStopping] = useActionState(stopMedication, null);

  const borderColor = medication.isActive ? "border-emerald-200" : "border-gray-200";
  const bgColor = medication.isActive ? "bg-emerald-50/50" : "bg-gray-50/50";

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} px-3 py-2.5`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              medication.isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-500"
            }`}>
              {medication.isActive ? "Actief" : "Gestopt"}
            </span>
            <span className="text-sm font-medium text-gray-800">{medication.medicationName}</span>
          </div>
          <p className="text-xs text-gray-600">
            <span className="font-semibold">Dosering:</span> {medication.dosage}
          </p>
          {medication.quantity && (
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Hoeveelheid:</span> {medication.quantity}
            </p>
          )}
          <p className="text-xs text-gray-500">
            {medication.startDate} — {medication.endDate ?? "lopend"}
          </p>
          {medication.notes && (
            <p className="text-xs text-gray-500">{medication.notes}</p>
          )}
          {deleteState && !deleteState.success && (
            <p className="text-xs text-red-600">{deleteState.error}</p>
          )}
          {stopState && !stopState.success && (
            <p className="text-xs text-red-600">{stopState.error}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {medication.isActive && (
            <form action={stopAction}>
              <input type="hidden" name="id" value={medication.id} />
              <button
                type="submit"
                disabled={isStopping}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
              >
                {isStopping ? "..." : "Stoppen"}
              </button>
            </form>
          )}
          <form action={deleteAction}>
            <input type="hidden" name="id" value={medication.id} />
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
