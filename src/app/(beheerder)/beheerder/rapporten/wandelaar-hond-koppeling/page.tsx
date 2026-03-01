import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { getWalkerAnimalPairingsReport } from "@/lib/queries/reports";
import DateRangeFilter from "@/components/beheerder/rapporten/DateRangeFilter";
import CsvExportButton from "./CsvExportButton";
import WalkerFilter from "./WalkerFilter";
import AnimalFilter from "./AnimalFilter";
import { exportWalkerAnimalPairingsCsvWrapper } from "./actions";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function WandelaarHondKoppelingRapportPage({ searchParams }: Props) {
  const permCheck = await requirePermission("report:read");
  if (permCheck && !permCheck.success) {
    redirect("/beheerder");
  }

  const params = await searchParams;

  const dateFrom = typeof params.van === "string" ? params.van : undefined;
  const dateTo = typeof params.tot === "string" ? params.tot : undefined;
  const walkerId = typeof params.wandelaar === "string" ? parseInt(params.wandelaar, 10) || undefined : undefined;
  const animalId = typeof params.dier === "string" ? parseInt(params.dier, 10) || undefined : undefined;

  const { pairings, total } = await getWalkerAnimalPairingsReport({
    walkerId, animalId, dateFrom, dateTo,
  });

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
            R10 — Wandelaar-hond koppelingen
          </h1>
          <p className="text-sm text-gray-500">{total} resultaten</p>
        </div>
        <Suspense>
          <CsvExportButton
            csvAction={exportWalkerAnimalPairingsCsvWrapper}
            filenamePrefix="wandelaar-hond-koppeling"
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
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Wandelaar</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Hond</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Aantal wandelingen</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Laatste wandeling</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {pairings.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  Geen wandelaar-hond koppelingen gevonden met de opgegeven filters.
                </td>
              </tr>
            ) : (
              pairings.map((pairing) => (
                <tr key={`${pairing.walkerId}-${pairing.animalId}`} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-600">{pairing.walkerFirstName} {pairing.walkerLastName}</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{pairing.animalName}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{pairing.walkCount}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{pairing.lastWalkDate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
