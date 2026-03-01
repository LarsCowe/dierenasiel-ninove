"use client";

import { useState } from "react";
import type { GdprSearchResult } from "@/types";
import GdprPersonDetail from "./GdprPersonDetail";

interface Props {
  results: GdprSearchResult[];
  onRefresh: () => void;
}

export default function GdprSearchResults({ results, onRefresh }: Props) {
  const [selectedPerson, setSelectedPerson] = useState<GdprSearchResult | null>(null);

  if (results.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Geen resultaten gevonden. Probeer een andere zoekterm.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Naam</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">E-mail</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {results.map((person) => (
              <tr key={`${person.type}-${person.id}`} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                  {person.type === "candidate" ? "Adoptant" : "Wandelaar"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  {person.firstName} {person.lastName}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                  {person.email}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {person.anonymisedAt ? (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      Geanonimiseerd
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      Actief
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPerson(person)}
                    className="text-sm font-medium text-[#1b4332] hover:text-[#2d6a4f] hover:underline"
                  >
                    Bekijken
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPerson && (
        <GdprPersonDetail
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
          onAnonymised={() => {
            setSelectedPerson(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
