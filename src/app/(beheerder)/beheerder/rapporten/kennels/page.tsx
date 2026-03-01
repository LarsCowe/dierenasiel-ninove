import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { getKennelOccupancyReport } from "@/lib/queries/reports";
import ReportExportBar from "@/components/beheerder/rapporten/ReportExportBar";
import ZoneFilter from "./ZoneFilter";

const ZONE_LABELS: Record<string, string> = {
  honden: "Honden",
  katten: "Katten",
  andere: "Andere",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function KennelBezettingRapportPage({ searchParams }: Props) {
  const permCheck = await requirePermission("report:read");
  if (permCheck && !permCheck.success) {
    redirect("/beheerder");
  }

  const params = await searchParams;

  const zone = typeof params.zone === "string" ? params.zone : undefined;

  const { kennels, total } = await getKennelOccupancyReport({ zone });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/beheerder/rapporten"
            className="text-sm text-emerald-700 hover:text-emerald-800"
          >
            &larr; Terug naar rapporten
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            R8 — Kennelbezetting
          </h1>
          <p className="text-sm text-gray-500">{total} kennels</p>
        </div>
        <Suspense>
          <ReportExportBar
            pdfUrl="/api/rapporten/kennels/pdf"
            filenamePrefix="kennelbezetting"
          />
        </Suspense>
      </div>

      {/* Zone filter */}
      <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <label htmlFor="zone" className="text-xs font-medium text-gray-600">
          Zone
        </label>
        <Suspense>
          <ZoneFilter />
        </Suspense>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Zone</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Capaciteit</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Bezet</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Vrij</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Bezettingsgraad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {kennels.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  Geen kennels gevonden met de opgegeven filters.
                </td>
              </tr>
            ) : (
              kennels.map((kennel) => {
                const free = kennel.capacity - kennel.count;
                const percentage = kennel.capacity > 0 ? Math.round((kennel.count / kennel.capacity) * 100) : 0;
                let badgeClass: string;
                if (percentage >= 90) {
                  badgeClass = "bg-red-100 text-red-700";
                } else if (percentage >= 70) {
                  badgeClass = "bg-yellow-100 text-yellow-700";
                } else {
                  badgeClass = "bg-green-100 text-green-700";
                }

                return (
                  <tr key={kennel.kennelId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{kennel.code}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{ZONE_LABELS[kennel.zone] ?? kennel.zone}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{kennel.capacity}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{kennel.count}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{free}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
                        {percentage}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
