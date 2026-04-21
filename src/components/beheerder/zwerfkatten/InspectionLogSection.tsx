"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addInspectionAction } from "@/lib/actions/stray-cat-campaigns";
import type { StrayCatCampaignInspection, ActionResult } from "@/types";

interface Props {
  campaignId: number;
  inspections: StrayCatCampaignInspection[];
}

async function handleAdd(prev: ActionResult | null, formData: FormData) {
  return addInspectionAction({
    campaignId: Number(formData.get("campaignId")),
    inspectionDate: formData.get("inspectionDate") as string,
    wasSuccessful: formData.get("wasSuccessful") === "on",
    notes: (formData.get("notes") as string) || "",
  });
}

export default function InspectionLogSection({ campaignId, inspections }: Props) {
  const [state, formAction, isPending] = useActionState(handleAdd, null);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      setShowForm(false);
    }
  }, [state, router]);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Inspectie-log
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {inspections.length}
          </span>
        </h3>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
          >
            + Inspectie toevoegen
          </button>
        )}
      </div>

      {inspections.length === 0 && !showForm && (
        <p className="py-4 text-center text-sm text-gray-400">
          Nog geen inspecties geregistreerd.
        </p>
      )}

      {inspections.length > 0 && (
        <ul className="mb-4 divide-y divide-gray-100">
          {inspections.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3 py-2.5 text-sm">
              <span
                className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                  entry.wasSuccessful
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {entry.wasSuccessful ? "✓ succesvol" : "— leeg"}
              </span>
              <span className="shrink-0 font-medium text-gray-700">
                {entry.inspectionDate}
              </span>
              {entry.notes && (
                <span className="flex-1 text-gray-600">{entry.notes}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <form action={formAction} className="space-y-3 rounded-lg bg-gray-50 p-4">
          <input type="hidden" name="campaignId" value={campaignId} />
          {state && !state.success && state.error && (
            <div className="rounded-lg bg-red-50 p-2 text-sm text-red-800">{state.error}</div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="inspectionDate" className="block text-xs font-medium text-gray-700">
                Datum *
              </label>
              <input
                type="date"
                id="inspectionDate"
                name="inspectionDate"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="wasSuccessful"
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Succesvol (kat in kooi)
              </label>
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block text-xs font-medium text-gray-700">
              Notities
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Bv. niets in kooien, kat te schuw..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? "Bezig..." : "Inspectie opslaan"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuleren
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
