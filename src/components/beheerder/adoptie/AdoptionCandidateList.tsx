import Link from "next/link";
import type { AdoptionCandidate } from "@/types";

interface Props {
  candidates: AdoptionCandidate[];
  activeCategory?: string;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: "Nieuw", className: "bg-blue-100 text-blue-800" },
  screening: { label: "Screening", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Goedgekeurd", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Afgewezen", className: "bg-red-100 text-red-800" },
  adopted: { label: "Geadopteerd", className: "bg-purple-100 text-purple-800" },
};

const CATEGORY_BADGES: Record<string, { label: string; className: string }> = {
  niet_weerhouden: { label: "Niet weerhouden", className: "bg-red-100 text-red-800" },
  mogelijks: { label: "Mogelijks", className: "bg-amber-100 text-amber-800" },
  goede_kandidaat: { label: "Goede kandidaat", className: "bg-emerald-100 text-emerald-800" },
};

const CATEGORY_FILTERS = [
  { value: "", label: "Alle" },
  { value: "goede_kandidaat", label: "Goede kandidaat" },
  { value: "mogelijks", label: "Mogelijks" },
  { value: "niet_weerhouden", label: "Niet weerhouden" },
];

export default function AdoptionCandidateList({ candidates, activeCategory }: Props) {
  return (
    <div className="space-y-4">
      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map((filter) => {
          const isActive = (activeCategory || "") === filter.value;
          return (
            <Link
              key={filter.value}
              href={filter.value ? `/beheerder/adoptie?categorie=${filter.value}` : "/beheerder/adoptie"}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#1b4332] text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {candidates.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            {activeCategory
              ? "Geen kandidaten gevonden met deze categorie."
              : "Er zijn nog geen adoptie-aanvragen. Registreer een nieuwe kandidaat."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-3">Naam</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Categorie</th>
                <th className="px-4 py-3">Datum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidates.map((candidate) => {
                const statusBadge = STATUS_BADGES[candidate.status] ?? STATUS_BADGES.pending;
                const catBadge = candidate.category ? CATEGORY_BADGES[candidate.category] : null;
                return (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {candidate.firstName} {candidate.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{candidate.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {catBadge ? (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${catBadge.className}`}>
                          {catBadge.label}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(candidate.createdAt).toLocaleDateString("nl-BE")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/beheerder/adoptie/${candidate.id}`}
                        className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
                      >
                        Bekijken
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
