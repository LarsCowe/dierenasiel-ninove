import { Suspense } from "react";
import Link from "next/link";
import { getVetVisitsReport } from "@/lib/queries/reports";
import { SPECIES_LABELS } from "@/lib/constants";
import DateRangeFilter from "@/components/beheerder/rapporten/DateRangeFilter";
import ReportExportBar from "@/components/beheerder/rapporten/ReportExportBar";
import Pagination from "@/components/beheerder/dieren/Pagination";

const PAGE_SIZE = 50;

const LOCATION_LABELS: Record<string, string> = {
  in_asiel: "In asiel",
  in_praktijk: "In praktijk",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DierenbezoekRapportPage({ searchParams }: Props) {
  const params = await searchParams;

  const dateFrom = typeof params.van === "string" ? params.van : undefined;
  const dateTo = typeof params.tot === "string" ? params.tot : undefined;
  const location = typeof params.locatie === "string" ? params.locatie : undefined;
  const page = typeof params.pagina === "string" ? parseInt(params.pagina, 10) || 1 : 1;

  const { visits, total } = await getVetVisitsReport({
    dateFrom, dateTo, location, page, pageSize: PAGE_SIZE,
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
            R2 — Dierenarts-bezoeken
          </h1>
          <p className="text-sm text-gray-500">{total} resultaten</p>
        </div>
        <Suspense>
          <ReportExportBar
            pdfUrl="/api/rapporten/dierenbezoeken/pdf"
            filenamePrefix="dierenbezoeken"
          />
        </Suspense>
      </div>

      <Suspense>
        <DateRangeFilter locationFilter />
      </Suspense>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Dier</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Soort</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Datum</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Locatie</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">To-do</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Klachten</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {visits.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  Geen dierenarts-bezoeken gevonden met de opgegeven filters.
                </td>
              </tr>
            ) : (
              visits.map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                    <Link href={`/beheerder/dieren/${visit.animalId}`} className="text-emerald-700 hover:underline">
                      {visit.animalName}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">{SPECIES_LABELS[visit.animalSpecies] ?? visit.animalSpecies}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{visit.date}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{LOCATION_LABELS[visit.location] ?? visit.location}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">{visit.todo ?? "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">{visit.complaints ?? "-"}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${visit.isCompleted ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {visit.isCompleted ? "Voltooid" : "Open"}
                    </span>
                  </td>
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
