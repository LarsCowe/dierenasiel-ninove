import Link from "next/link";
import { getPlannedFollowupsForOverview } from "@/lib/queries/post-adoption-followups";
import { daysUntil, urgencyColor, deadlineLabel } from "@/lib/utils/date";

const TYPE_LABELS: Record<string, string> = {
  "1_week": "1 week",
  "1_month": "1 maand",
  custom: "Extra",
};

export default async function OpvolgingOverviewPage() {
  const rows = await getPlannedFollowupsForOverview();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4">
        <Link
          href="/beheerder/adoptie"
          className="text-sm text-emerald-700 hover:text-emerald-900"
        >
          &larr; Terug naar adoptie
        </Link>
      </div>

      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
        Post-adoptie opvolgingen
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Alle geplande opvolgingen — bel de adoptant en registreer het resultaat.
      </p>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">Geen geplande opvolgingen op dit moment.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Dier</th>
                <th className="px-4 py-3">Adoptant</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Datum</th>
                <th className="px-4 py-3">Urgentie</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => {
                const days = daysUntil(row.followup.date);
                const isOverdue = days <= 0;
                return (
                  <tr
                    key={row.followup.id}
                    className={isOverdue ? "bg-red-50" : ""}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.animal.name}
                      <span className="ml-1 text-xs text-gray-500">({row.animal.species})</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">
                        {row.candidate.firstName} {row.candidate.lastName}
                      </div>
                      {row.candidate.phone && (
                        <div className="text-xs text-gray-500">{row.candidate.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {TYPE_LABELS[row.followup.followupType] ?? row.followup.followupType}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(row.followup.date).toLocaleDateString("nl-BE")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${urgencyColor(days)}`}>
                        {deadlineLabel(days)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/beheerder/adoptie/${row.candidate.id}`}
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
