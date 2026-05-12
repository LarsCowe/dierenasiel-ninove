"use client";

import Link from "next/link";
import { daysUntil, urgencyColor, deadlineLabel } from "@/lib/utils/date";
import { useClickableRow } from "@/lib/hooks/useClickableRow";
import type { FollowupOverviewRow } from "@/lib/queries/post-adoption-followups";

interface Props {
  rows: FollowupOverviewRow[];
}

const TYPE_LABELS: Record<string, string> = {
  "1_week": "1 week",
  "1_month": "1 maand",
  custom: "Extra",
};

function FollowupRow({ row }: { row: FollowupOverviewRow }) {
  const days = daysUntil(row.followup.date);
  const isOverdue = days <= 0;
  const rowProps = useClickableRow(`/beheerder/adoptie/${row.candidate.id}`, {
    ariaLabel: `Bekijk opvolging ${row.candidate.firstName} ${row.candidate.lastName} – ${row.animal.name}`,
  });

  return (
    <tr
      {...rowProps}
      className={`cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 ${
        isOverdue ? "bg-red-50" : ""
      }`}
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
}

export default function PostAdoptionFollowupList({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500">Geen geplande opvolgingen op dit moment.</p>
      </div>
    );
  }

  return (
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
          {rows.map((row) => (
            <FollowupRow key={row.followup.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
