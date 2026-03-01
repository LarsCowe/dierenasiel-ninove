import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { getWorkflowOverviewReport } from "@/lib/queries/reports";
import { SPECIES_LABELS } from "@/lib/constants";
import { PHASE_LABELS } from "@/lib/workflow/stepbar";
import DateRangeFilter from "@/components/beheerder/rapporten/DateRangeFilter";
import ReportExportBar from "@/components/beheerder/rapporten/ReportExportBar";
import Pagination from "@/components/beheerder/dieren/Pagination";
import SpeciesFilter from "./SpeciesFilter";
import PhaseFilter from "./PhaseFilter";
import { exportWorkflowOverviewCsvWrapper } from "./actions";

const PAGE_SIZE = 50;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function WorkflowOverzichtRapportPage({ searchParams }: Props) {
  const permCheck = await requirePermission("report:read");
  if (permCheck && !permCheck.success) {
    redirect("/beheerder");
  }

  const params = await searchParams;

  const species = typeof params.soort === "string" ? params.soort : undefined;
  const workflowPhase = typeof params.fase === "string" ? params.fase : undefined;
  const dateFrom = typeof params.van === "string" ? params.van : undefined;
  const dateTo = typeof params.tot === "string" ? params.tot : undefined;
  const page = typeof params.pagina === "string" ? parseInt(params.pagina, 10) || 1 : 1;

  const { animals, total } = await getWorkflowOverviewReport({
    species, workflowPhase, dateFrom, dateTo, page, pageSize: PAGE_SIZE,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Calculate knelpunt: average daysSinceIntake per phase, then mark > 1.5x average
  // NB: berekening is op huidige pagina (max PAGE_SIZE rijen). PDF berekent over volledige dataset.
  const phaseAverages: Record<string, { sum: number; count: number }> = {};
  for (const animal of animals) {
    const phase = animal.workflowPhase ?? "unknown";
    if (animal.daysSinceIntake != null) {
      if (!phaseAverages[phase]) {
        phaseAverages[phase] = { sum: 0, count: 0 };
      }
      phaseAverages[phase].sum += animal.daysSinceIntake;
      phaseAverages[phase].count += 1;
    }
  }

  function isKnelpunt(phase: string | null, days: number | null): boolean {
    if (days == null || phase == null) return false;
    const avg = phaseAverages[phase];
    if (!avg || avg.count === 0) return false;
    return days > (avg.sum / avg.count) * 1.5;
  }

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
            R13 — Workflow-overzicht
          </h1>
          <p className="text-sm text-gray-500">{total} resultaten</p>
        </div>
        <Suspense>
          <ReportExportBar
            csvAction={exportWorkflowOverviewCsvWrapper}
            pdfUrl="/api/rapporten/workflow-overzicht/pdf"
            filenamePrefix="workflow-overzicht"
          />
        </Suspense>
      </div>

      {/* Filters */}
      <Suspense>
        <DateRangeFilter />
      </Suspense>

      <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <label htmlFor="soort" className="text-xs font-medium text-gray-600">
          Soort
        </label>
        <Suspense>
          <SpeciesFilter />
        </Suspense>
        <label htmlFor="fase" className="text-xs font-medium text-gray-600">
          Fase
        </label>
        <Suspense>
          <PhaseFilter />
        </Suspense>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Naam</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Soort</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fase</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Intakedatum</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Dagen in asiel</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Knelpunt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {animals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  Geen dieren gevonden met de opgegeven filters.
                </td>
              </tr>
            ) : (
              animals.map((animal) => {
                const knelpunt = isKnelpunt(animal.workflowPhase, animal.daysSinceIntake);
                return (
                  <tr key={animal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{animal.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{SPECIES_LABELS[animal.species] ?? animal.species}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{PHASE_LABELS[animal.workflowPhase ?? ""] ?? animal.workflowPhase ?? "-"}</td>
                    <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{animal.intakeDate ?? "-"}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{animal.daysSinceIntake ?? "-"}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${knelpunt ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {knelpunt ? "Ja" : "Nee"}
                      </span>
                    </td>
                  </tr>
                );
              })
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
