"use client";

import { useActionState } from "react";
import { createMedicationLog, deleteMedicationLog } from "@/lib/actions/medication-logs";

interface MedicationCheckoffProps {
  medicationId: number;
  medicationName: string;
  dosage: string;
  quantity: string | null;
  notes: string | null;
  todayLog: {
    id: number;
    administeredAt: Date;
    administeredBy: string | null;
    notes: string | null;
  } | null;
}

export default function MedicationCheckoff({
  medicationId,
  medicationName,
  dosage,
  quantity,
  notes,
  todayLog,
}: MedicationCheckoffProps) {
  const [checkState, checkAction, isChecking] = useActionState(createMedicationLog, null);
  const [undoState, undoAction, isUndoing] = useActionState(deleteMedicationLog, null);

  const isDone = todayLog !== null;
  const borderColor = isDone ? "border-emerald-200" : "border-amber-200";
  const bgColor = isDone ? "bg-emerald-50/50" : "bg-amber-50/50";

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} px-3 py-2.5`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {isDone ? (
              <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
              </svg>
            )}
            <span className="text-sm font-medium text-gray-800">{medicationName}</span>
          </div>
          <p className="text-xs text-gray-600">
            <span className="font-semibold">Dosering:</span> {dosage}
          </p>
          {quantity && (
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Hoeveelheid:</span> {quantity}
            </p>
          )}
          {notes && (
            <p className="text-xs text-gray-500">{notes}</p>
          )}
          {isDone && todayLog && (
            <p className="text-xs text-emerald-600">
              Toegediend om {new Date(todayLog.administeredAt).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" })}
              {todayLog.administeredBy && ` door ${todayLog.administeredBy}`}
            </p>
          )}
          {checkState && !checkState.success && (
            <p className="text-xs text-red-600">{checkState.error}</p>
          )}
          {undoState && !undoState.success && (
            <p className="text-xs text-red-600">{undoState.error}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {!isDone ? (
            <form action={checkAction}>
              <input type="hidden" name="medicationId" value={medicationId} />
              <button
                type="submit"
                disabled={isChecking}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isChecking ? "..." : "Afvinken"}
              </button>
            </form>
          ) : (
            <form action={undoAction}>
              <input type="hidden" name="id" value={todayLog!.id} />
              <button
                type="submit"
                disabled={isUndoing}
                className="text-xs font-medium text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                {isUndoing ? "..." : "Ongedaan maken"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
