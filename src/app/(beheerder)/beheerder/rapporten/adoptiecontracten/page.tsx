import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { getAdoptionContractsReport } from "@/lib/queries/reports";
import { SPECIES_LABELS } from "@/lib/constants";
import DateRangeFilter from "@/components/beheerder/rapporten/DateRangeFilter";
import ReportExportBar from "@/components/beheerder/rapporten/ReportExportBar";
import Pagination from "@/components/beheerder/dieren/Pagination";
import PaymentMethodFilter from "./PaymentMethodFilter";
import { exportAdoptionContractsCsvWrapper } from "./actions";

const PAGE_SIZE = 50;

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  payconiq: "Payconiq",
  overschrijving: "Overschrijving",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdoptiecontractenRapportPage({ searchParams }: Props) {
  const permCheck = await requirePermission("report:read");
  if (permCheck && !permCheck.success) {
    redirect("/beheerder");
  }

  const params = await searchParams;

  const dateFrom = typeof params.van === "string" ? params.van : undefined;
  const dateTo = typeof params.tot === "string" ? params.tot : undefined;
  const paymentMethod = typeof params.betaalwijze === "string" ? params.betaalwijze : undefined;
  const page = typeof params.pagina === "string" ? parseInt(params.pagina, 10) || 1 : 1;

  const { contracts, total } = await getAdoptionContractsReport({
    dateFrom, dateTo, paymentMethod, page, pageSize: PAGE_SIZE,
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
            R3 — Adoptiecontracten
          </h1>
          <p className="text-sm text-gray-500">{total} resultaten</p>
        </div>
        <Suspense>
          <ReportExportBar
            csvAction={exportAdoptionContractsCsvWrapper}
            pdfUrl="/api/rapporten/adoptiecontracten/pdf"
            filenamePrefix="adoptiecontracten"
          />
        </Suspense>
      </div>

      {/* Filters */}
      <Suspense>
        <DateRangeFilter />
      </Suspense>

      <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <label htmlFor="betaalwijze" className="text-xs font-medium text-gray-600">
          Betaalwijze
        </label>
        <Suspense>
          <PaymentMethodFilter />
        </Suspense>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Dier</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Soort</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Adoptant</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Datum</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Bedrag</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Betaalwijze</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">DogID/CatID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Opmerkingen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                  Geen adoptiecontracten gevonden met de opgegeven filters.
                </td>
              </tr>
            ) : (
              contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                    {contract.animalName}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">{SPECIES_LABELS[contract.animalSpecies] ?? contract.animalSpecies}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{contract.candidateFirstName} {contract.candidateLastName}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{contract.contractDate}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">&euro; {contract.paymentAmount}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{PAYMENT_LABELS[contract.paymentMethod] ?? contract.paymentMethod}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${contract.dogidCatidTransferred ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {contract.dogidCatidTransferred ? "Overgedragen" : "Niet overgedragen"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">{contract.notes ?? "-"}</td>
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
