"use client";

import { useActionState } from "react";
import { toggleBlacklistEntry } from "@/lib/actions/blacklist";
import type { BlacklistEntry } from "@/types";

interface Props {
  entries: BlacklistEntry[];
  onEdit: (entry: BlacklistEntry) => void;
}

function ToggleButton({ entry }: { entry: BlacklistEntry }) {
  const [, formAction, isPending] = useActionState(toggleBlacklistEntry, null);

  return (
    <form action={formAction}>
      <input
        type="hidden"
        name="json"
        value={JSON.stringify({ id: entry.id, isActive: !entry.isActive })}
      />
      <button
        type="submit"
        disabled={isPending}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
          entry.isActive
            ? "bg-emerald-100 text-emerald-800 hover:bg-red-100 hover:text-red-800"
            : "bg-gray-100 text-gray-500 hover:bg-emerald-100 hover:text-emerald-800"
        }`}
      >
        {isPending ? "..." : entry.isActive ? "Actief" : "Inactief"}
      </button>
    </form>
  );
}

export default function BlacklistTable({ entries, onEdit }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          Er staan nog geen items op de zwarte lijst.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
            <th className="px-4 py-3">Naam</th>
            <th className="px-4 py-3">Adres</th>
            <th className="px-4 py-3">Reden</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Toegevoegd</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">
                {entry.firstName} {entry.lastName}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {entry.address || <span className="text-gray-400">-</span>}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-gray-600">
                {entry.reason}
              </td>
              <td className="px-4 py-3">
                <ToggleButton entry={entry} />
              </td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(entry.createdAt).toLocaleDateString("nl-BE")}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEdit(entry)}
                  className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
                >
                  Bewerken
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
