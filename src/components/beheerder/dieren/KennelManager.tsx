"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createKennel, deleteKennel } from "@/lib/actions/kennels";
import { KENNEL_ZONES } from "@/lib/validations/kennels";
import type { Kennel } from "@/types";

const ZONE_LABELS: Record<string, string> = {
  honden: "Honden",
  katten: "Katten",
  andere: "Andere",
};

interface Props {
  kennels: Kennel[];
}

export default function KennelManager({ kennels }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [createState, createAction, isCreating] = useActionState(createKennel, null);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-[#1b4332]">
          Kennels beheren
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-[#1b4332] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2d6a4f]"
          >
            Kennel toevoegen
          </button>
        )}
      </div>

      {showForm && (
        <form action={createAction} className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label htmlFor="k-code" className="block text-xs font-medium text-gray-600">
                Code *
              </label>
              <input
                id="k-code"
                name="code"
                type="text"
                required
                maxLength={10}
                placeholder="bv. H1"
                className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="k-zone" className="block text-xs font-medium text-gray-600">
                Zone *
              </label>
              <select
                id="k-zone"
                name="zone"
                required
                defaultValue=""
                className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="" disabled>Kies...</option>
                {KENNEL_ZONES.map((z) => (
                  <option key={z} value={z}>{ZONE_LABELS[z]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="k-capacity" className="block text-xs font-medium text-gray-600">
                Capaciteit *
              </label>
              <input
                id="k-capacity"
                name="capacity"
                type="number"
                required
                min={1}
                max={20}
                defaultValue={2}
                className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="k-notes" className="block text-xs font-medium text-gray-600">
                Opmerkingen
              </label>
              <input
                id="k-notes"
                name="notes"
                type="text"
                maxLength={500}
                className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>

          {createState && !createState.success && createState.error && (
            <p className="text-sm text-red-600">{createState.error}</p>
          )}
          {createState?.success && (
            <p className="text-sm text-emerald-600">{createState.message}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-md bg-[#1b4332] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
            >
              {isCreating ? "Aanmaken..." : "Toevoegen"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuleren
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Zone</th>
              <th className="px-3 py-2">Capaciteit</th>
              <th className="px-3 py-2">Opmerkingen</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {kennels.map((kennel) => (
              <KennelRow key={kennel.id} kennel={kennel} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KennelRow({ kennel }: { kennel: Kennel }) {
  const [state, formAction, isDeleting] = useActionState(deleteKennel, null);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-2 font-medium text-gray-800">{kennel.code}</td>
      <td className="px-3 py-2 text-gray-600">{ZONE_LABELS[kennel.zone] ?? kennel.zone}</td>
      <td className="px-3 py-2 text-gray-600">{kennel.capacity}</td>
      <td className="px-3 py-2 text-xs text-gray-500">{kennel.notes || "—"}</td>
      <td className="px-3 py-2 text-right">
        <form action={formAction} className="inline">
          <input type="hidden" name="id" value={kennel.id} />
          <button
            type="submit"
            disabled={isDeleting}
            className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            {isDeleting ? "..." : "Verwijderen"}
          </button>
        </form>
        {state && !state.success && (
          <p className="mt-0.5 text-xs text-red-600">{state.error}</p>
        )}
      </td>
    </tr>
  );
}
