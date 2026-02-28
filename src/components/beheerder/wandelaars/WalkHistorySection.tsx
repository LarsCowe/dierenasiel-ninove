import { formatDate } from "@/lib/utils";
import type { WalkHistoryEntry, WalkStats } from "@/types";
import CsvExportButton from "./CsvExportButton";

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  planned: { label: "Gepland", bg: "bg-blue-100", text: "text-blue-800" },
  in_progress: { label: "Bezig", bg: "bg-amber-100", text: "text-amber-800" },
  completed: { label: "Voltooid", bg: "bg-emerald-100", text: "text-emerald-800" },
  cancelled: { label: "Geannuleerd", bg: "bg-gray-100", text: "text-gray-500" },
};

interface WalkHistorySectionProps {
  entries: WalkHistoryEntry[];
  stats: WalkStats;
  walkerId?: number;
  animalId?: number;
  companionLabel: string;
}

export default function WalkHistorySection({
  entries,
  stats,
  walkerId,
  animalId,
  companionLabel,
}: WalkHistorySectionProps) {
  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Totaal wandelingen</p>
          <p className="mt-1 text-2xl font-bold text-[#1b4332]">{stats.totalWalks}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Gem. duur</p>
          <p className="mt-1 text-2xl font-bold text-[#1b4332]">
            {stats.avgDurationMinutes !== null ? `${stats.avgDurationMinutes} min` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{companionLabel}</p>
          <p className="mt-1 text-lg font-bold text-[#1b4332]">{stats.topCompanion ?? "—"}</p>
        </div>
      </div>

      {/* Header with export button */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold text-[#1b4332]">Wandelgeschiedenis</h3>
        {entries.length > 0 && (
          <CsvExportButton walkerId={walkerId} animalId={animalId} />
        )}
      </div>

      {/* Walk history table */}
      {entries.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-sm text-gray-500">Nog geen wandelingen.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Datum</th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  {walkerId ? "Hond" : "Wandelaar"}
                </th>
                <th className="px-4 py-3 font-medium text-gray-600">Duur</th>
                <th className="px-4 py-3 font-medium text-gray-600">Opmerkingen</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry) => {
                const status = STATUS_LABELS[entry.status] ?? STATUS_LABELS.planned;
                return (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 text-gray-800">{formatDate(entry.date)}</td>
                    <td className="px-4 py-3 font-medium text-[#1b4332]">
                      {walkerId
                        ? entry.animalName
                        : `${entry.walkerFirstName} ${entry.walkerLastName}`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {entry.durationMinutes !== null ? `${entry.durationMinutes} min` : "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-gray-500">
                      {entry.remarks ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
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
