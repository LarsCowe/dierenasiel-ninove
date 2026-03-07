"use client";

import { useActionState } from "react";
import { deleteVaccination } from "@/lib/actions/vaccinations";
import type { Vaccination } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  DHP: "DHP",
  Kennelhoest: "Kennelhoest",
  L4: "Leptospirose (L4)",
};

interface VaccinationListProps {
  vaccinations: Vaccination[];
}

export default function VaccinationList({ vaccinations }: VaccinationListProps) {
  if (vaccinations.length === 0) {
    return <p className="text-sm text-gray-500">Nog geen vaccinaties geregistreerd.</p>;
  }

  return (
    <div className="space-y-2">
      {vaccinations.map((v) => (
        <VaccinationRow key={v.id} vaccination={v} />
      ))}
    </div>
  );
}

function VaccinationRow({ vaccination }: { vaccination: Vaccination }) {
  const [state, formAction, isPending] = useActionState(deleteVaccination, null);

  return (
    <div className="flex items-start justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {TYPE_LABELS[vaccination.type] ?? vaccination.type}
          </span>
          <span className="text-sm font-medium text-gray-800">{vaccination.date}</span>
          {!vaccination.givenByShelter && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              Extern
            </span>
          )}
        </div>
        {vaccination.nextDueDate && (
          <p className="text-xs text-amber-700">
            Vervaldatum: {vaccination.nextDueDate}
          </p>
        )}
        {vaccination.notes && (
          <p className="text-xs text-gray-500">{vaccination.notes}</p>
        )}
        {state && !state.success && (
          <p className="text-xs text-red-600">{state.error}</p>
        )}
      </div>
      <form action={formAction}>
        <input type="hidden" name="id" value={vaccination.id} />
        <button
          type="submit"
          disabled={isPending}
          className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          {isPending ? "..." : "Verwijderen"}
        </button>
      </form>
    </div>
  );
}
