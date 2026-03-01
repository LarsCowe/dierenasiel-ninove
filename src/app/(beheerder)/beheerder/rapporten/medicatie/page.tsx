import { Suspense } from "react";
import Link from "next/link";
import { getMedicationReport } from "@/lib/queries/reports";
import { SPECIES_LABELS } from "@/lib/constants";
import ReportExportBar from "@/components/beheerder/rapporten/ReportExportBar";
import Pagination from "@/components/beheerder/dieren/Pagination";
import MedicationStatusFilter from "./StatusFilter";
import { exportMedicationReportCsvWrapper } from "./actions";

const PAGE_SIZE = 50;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MedicatieRapportPage({ searchParams }: Props) {
  const params = await searchParams;

  const statusParam = typeof params.status === "string" ? params.status : undefined;
  const isActive = statusParam === "actief" ? true : statusParam === "afgerond" ? false : undefined;
  const page = typeof params.pagina === "string" ? parseInt(params.pagina, 10) || 1 : 1;

  const { medications, total } = await getMedicationReport({
    isActive, page, pageSize: PAGE_SIZE,
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
            R5 — Medicatie-opvolging
          </h1>
          <p className="text-sm text-gray-500">{total} resultaten</p>
        </div>
        <Suspense>
          <ReportExportBar
            csvAction={exportMedicationReportCsvWrapper}
            pdfUrl="/api/rapporten/medicatie/pdf"
            filenamePrefix="medicatie-opvolging"
          />
        </Suspense>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <label htmlFor="status" className="text-xs font-medium text-gray-600">
          Status
        </label>
        <Suspense>
          <MedicationStatusFilter />
        </Suspense>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Dier</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Soort</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Medicatie</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Dosering</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Start</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Eind</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Opmerkingen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {medications.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                  Geen medicaties gevonden met de opgegeven filters.
                </td>
              </tr>
            ) : (
              medications.map((med) => (
                <tr key={med.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                    <Link href={`/beheerder/dieren/${med.animalId}`} className="text-emerald-700 hover:underline">
                      {med.animalName}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">{SPECIES_LABELS[med.animalSpecies] ?? med.animalSpecies}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{med.medicationName}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{med.dosage}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{med.startDate}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{med.endDate ?? "-"}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${med.isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                      {med.isActive ? "Actief" : "Afgerond"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">{med.notes ?? "-"}</td>
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
