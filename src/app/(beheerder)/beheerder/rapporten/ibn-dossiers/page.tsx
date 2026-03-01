import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { getIBNDossiersReport } from "@/lib/queries/reports";
import { SPECIES_LABELS } from "@/lib/constants";
import { PHASE_LABELS } from "@/lib/workflow/stepbar";
import DateRangeFilter from "@/components/beheerder/rapporten/DateRangeFilter";
import ReportExportBar from "@/components/beheerder/rapporten/ReportExportBar";
import Pagination from "@/components/beheerder/dieren/Pagination";

const PAGE_SIZE = 50;

function getUrgencyBadge(deadline: string | null): { label: string; className: string } {
  if (!deadline) {
    return { label: "-", className: "bg-gray-100 text-gray-600" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffMs = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: "Verlopen", className: "bg-red-200 text-red-800" };
  }
  if (diffDays < 14) {
    return { label: "Urgent", className: "bg-red-100 text-red-700" };
  }
  if (diffDays < 30) {
    return { label: "Opgelet", className: "bg-orange-100 text-orange-700" };
  }
  return { label: "OK", className: "bg-green-100 text-green-700" };
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function IBNDossiersRapportPage({ searchParams }: Props) {
  const permCheck = await requirePermission("report:read");
  if (permCheck && !permCheck.success) {
    redirect("/beheerder");
  }

  const params = await searchParams;

  const deadlineFrom = typeof params.van === "string" ? params.van : undefined;
  const deadlineTo = typeof params.tot === "string" ? params.tot : undefined;
  const page = typeof params.pagina === "string" ? parseInt(params.pagina, 10) || 1 : 1;

  const { dossiers, total } = await getIBNDossiersReport({
    deadlineFrom, deadlineTo, page, pageSize: PAGE_SIZE,
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
            R12 — IBN-dossiers
          </h1>
          <p className="text-sm text-gray-500">{total} resultaten</p>
        </div>
        <Suspense>
          <ReportExportBar
            pdfUrl="/api/rapporten/ibn-dossiers/pdf"
            filenamePrefix="ibn-dossiers"
          />
        </Suspense>
      </div>

      <Suspense>
        <DateRangeFilter />
      </Suspense>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Dossiernr</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">PV-nr</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Dier</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Soort</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Deadline</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fase</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Intake</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Urgentie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {dossiers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                  Geen IBN-dossiers gevonden met de opgegeven filters.
                </td>
              </tr>
            ) : (
              dossiers.map((dossier) => {
                const urgency = getUrgencyBadge(dossier.ibnDecisionDeadline);
                return (
                  <tr key={dossier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{dossier.dossierNr}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{dossier.pvNr ?? "-"}</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      <Link href={`/beheerder/dieren/${dossier.id}`} className="text-emerald-700 hover:underline">
                        {dossier.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{SPECIES_LABELS[dossier.species] ?? dossier.species}</td>
                    <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{dossier.ibnDecisionDeadline ?? "-"}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {dossier.workflowPhase ? (PHASE_LABELS[dossier.workflowPhase] ?? dossier.workflowPhase) : "-"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{dossier.intakeDate ?? "-"}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${urgency.className}`}>
                        {urgency.label}
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
