import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { getWalkActivityReport } from "@/lib/queries/reports";
import DateRangeFilter from "@/components/beheerder/rapporten/DateRangeFilter";
import ReportExportBar from "@/components/beheerder/rapporten/ReportExportBar";
import Pagination from "@/components/beheerder/dieren/Pagination";
import WalkerFilter from "./WalkerFilter";
import AnimalFilter from "./AnimalFilter";
import { exportWalkActivityCsvWrapper } from "./actions";

const PAGE_SIZE = 50;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function WandelactiviteitRapportPage({ searchParams }: Props) {
  const permCheck = await requirePermission("report:read");
  if (permCheck && !permCheck.success) {
    redirect("/beheerder");
  }

  const params = await searchParams;

  const dateFrom = typeof params.van === "string" ? params.van : undefined;
  const dateTo = typeof params.tot === "string" ? params.tot : undefined;
  const walkerId = typeof params.wandelaar === "string" ? parseInt(params.wandelaar, 10) || undefined : undefined;
  const animalId = typeof params.dier === "string" ? parseInt(params.dier, 10) || undefined : undefined;
  const page = typeof params.pagina === "string" ? parseInt(params.pagina, 10) || 1 : 1;

  const { walks, total } = await getWalkActivityReport({
    dateFrom, dateTo, walkerId, animalId, page, pageSize: PAGE_SIZE,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
            R9 — Wandelactiviteit
          </h1>
          <p className="text-sm text-gray-500">{total} resultaten</p>
        </div>
        <Suspense>
          <ReportExportBar
            csvAction={exportWalkActivityCsvWrapper}
            pdfUrl="/api/rapporten/wandelactiviteit/pdf"
            filenamePrefix="wandelactiviteit"
          />
        </Suspense>
      </div>

      {/* Filters */}
      <Suspense>
        <DateRangeFilter />
      </Suspense>

      <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <label htmlFor="wandelaar" className="text-xs font-medium text-gray-600">
          Wandelaar ID
        </label>
        <Suspense>
          <WalkerFilter />
        </Suspense>
        <label htmlFor="dier" className="text-xs font-medium text-gray-600">
          Dier ID
        </label>
        <Suspense>
          <AnimalFilter />
        </Suspense>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Datum</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Wandelaar</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Hond</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Start</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Einde</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Duur (min)</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Opmerkingen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {walks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  Geen wandelactiviteit gevonden met de opgegeven filters.
                </td>
              </tr>
            ) : (
              walks.map((walk) => (
                <tr key={walk.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{walk.date}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{walk.walkerFirstName} {walk.walkerLastName}</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{walk.animalName}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{walk.startTime}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{walk.endTime ?? "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{walk.durationMinutes ?? "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">{walk.remarks ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} />
      )}
    </div>
  );
}
