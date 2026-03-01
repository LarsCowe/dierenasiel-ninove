import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { getWebsitePublicationReport } from "@/lib/queries/reports";
import { speciesLabel, genderLabel } from "@/lib/utils";
import Pagination from "@/components/beheerder/dieren/Pagination";
import CsvExportButton from "./CsvExportButton";
import { exportWebsitePublicationCsvWrapper } from "./actions";

const PAGE_SIZE = 50;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function WebsitePublicatieRapportPage({ searchParams }: Props) {
  const permCheck = await requirePermission("report:read");
  if (permCheck && !permCheck.success) {
    redirect("/beheerder");
  }

  const params = await searchParams;

  const page = typeof params.pagina === "string" ? parseInt(params.pagina, 10) || 1 : 1;

  const { animals, total } = await getWebsitePublicationReport({
    page, pageSize: PAGE_SIZE,
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
            R7 — Website-publicatie
          </h1>
          <p className="text-sm text-gray-500">{total} resultaten</p>
        </div>
        <Suspense>
          <CsvExportButton
            csvAction={exportWebsitePublicationCsvWrapper}
            filenamePrefix="website-publicatie"
          />
        </Suspense>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Naam</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Soort</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ras</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Geslacht</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Chipnr</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Korte beschrijving</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {animals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  Geen dieren gepubliceerd op de website.
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
                  <td className="px-4 py-2 text-sm text-gray-600">{animal.identificationNr ?? "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">{animal.shortDescription ?? "-"}</td>
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
