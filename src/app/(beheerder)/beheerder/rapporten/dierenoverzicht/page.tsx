import { Suspense } from "react";
import Link from "next/link";
import { getAnimalReport } from "@/lib/queries/reports";
import { getKennels } from "@/lib/queries/kennels";
import { speciesLabel, genderLabel, statusLabel } from "@/lib/utils";
import { PHASE_LABELS } from "@/lib/workflow/stepbar";
import ReportFilters from "@/components/beheerder/rapporten/ReportFilters";
import ReportExportBar from "@/components/beheerder/rapporten/ReportExportBar";
import Pagination from "@/components/beheerder/dieren/Pagination";
import { exportAnimalReportCsvWrapper } from "./actions";

const PAGE_SIZE = 50;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DierenoverzichtRapportPage({ searchParams }: Props) {
  const params = await searchParams;

  const species = typeof params.soort === "string" ? params.soort : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const kennelId = typeof params.kennel === "string" ? parseInt(params.kennel, 10) : undefined;
  const workflowPhase = typeof params.fase === "string" ? params.fase : undefined;
  const page = typeof params.pagina === "string" ? parseInt(params.pagina, 10) || 1 : 1;

  const [{ animals, total }, kennels] = await Promise.all([
    getAnimalReport({ species, status, kennelId, workflowPhase, page, pageSize: PAGE_SIZE }),
    getKennels(),
  ]);

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
            R1 — Overzicht dieren in asiel
          </h1>
          <p className="text-sm text-gray-500">{total} resultaten</p>
        </div>
        <Suspense>
          <ReportExportBar
            csvAction={exportAnimalReportCsvWrapper}
            pdfUrl="/api/rapporten/dierenoverzicht/pdf"
            filenamePrefix="dierenoverzicht"
          />
        </Suspense>
      </div>

      <Suspense>
        <ReportFilters kennels={kennels} />
      </Suspense>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Naam</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Soort</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ras</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Geslacht</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fase</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Chipnr</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">Intake datum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {animals.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                  Geen dieren gevonden met de opgegeven filters.
                </td>
              </tr>
            ) : (
              animals.map((animal) => (
                <tr key={animal.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                    <Link href={`/beheerder/dieren/${animal.id}`} className="text-emerald-700 hover:underline">
                      {animal.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">{speciesLabel(animal.species)}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{animal.breed ?? "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{genderLabel(animal.gender)}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {statusLabel(animal.status ?? "")}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {animal.workflowPhase ? (PHASE_LABELS[animal.workflowPhase] ?? animal.workflowPhase) : "-"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">{animal.identificationNr ?? "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{animal.intakeDate ?? "-"}</td>
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
