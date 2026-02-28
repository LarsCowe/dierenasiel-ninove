import Link from "next/link";
import type { Walker } from "@/types";

interface Props {
  walkers: Walker[];
  activeStatus?: string;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: "In afwachting", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Goedgekeurd", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Afgewezen", className: "bg-red-100 text-red-800" },
  inactive: { label: "Inactief", className: "bg-gray-100 text-gray-600" },
};

const STATUS_FILTERS = [
  { value: "", label: "Alle" },
  { value: "pending", label: "In afwachting" },
  { value: "approved", label: "Goedgekeurd" },
  { value: "rejected", label: "Afgewezen" },
  { value: "inactive", label: "Inactief" },
];

export default function WalkerList({ walkers, activeStatus }: Props) {
  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const isActive = (activeStatus || "") === filter.value;
          return (
            <Link
              key={filter.value}
              href={filter.value ? `/beheerder/wandelaars?status=${filter.value}` : "/beheerder/wandelaars"}
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

      {walkers.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            {activeStatus
              ? "Geen wandelaars gevonden met deze status."
              : "Er zijn nog geen geregistreerde wandelaars."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-3">Naam</th>
                <th className="px-4 py-3">Email</th>
                <th className="hidden px-4 py-3 sm:table-cell">Telefoon</th>
                <th className="px-4 py-3">Barcode</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 sm:table-cell">Datum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {walkers.map((walker) => {
                const badge = STATUS_BADGES[walker.status] ?? STATUS_BADGES.pending;
                return (
                  <tr key={walker.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {walker.firstName} {walker.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{walker.email}</td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">{walker.phone}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{walker.barcode || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                      {new Date(walker.createdAt).toLocaleDateString("nl-BE")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/beheerder/wandelaars/${walker.id}`}
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
