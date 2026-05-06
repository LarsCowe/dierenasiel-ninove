import { Suspense } from "react";
import Link from "next/link";
import { getCampaignsForAdmin, getDistinctMunicipalities } from "@/lib/queries/stray-cat-campaigns";
import { getAllMunicipalityLogosIncludingDeleted } from "@/lib/queries/municipality-logos";
import CampaignFilters from "@/components/beheerder/zwerfkatten/CampaignFilters";
import CampaignTable from "@/components/beheerder/zwerfkatten/CampaignTable";
import Pagination from "@/components/beheerder/dieren/Pagination";

interface Props {
  searchParams: Promise<{
    gemeente?: string;
    status?: string;
    van?: string;
    tot?: string;
    pagina?: string;
  }>;
}

const PAGE_SIZE = 25;

export default async function ZwerfkattenbeleidPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.pagina) || 1);

  const [{ campaigns, total }, municipalities, logos] = await Promise.all([
    getCampaignsForAdmin({
      municipality: params.gemeente,
      status: params.status,
      dateFrom: params.van,
      dateTo: params.tot,
      page,
      pageSize: PAGE_SIZE,
    }),
    getDistinctMunicipalities(),
    getAllMunicipalityLogosIncludingDeleted(),
  ]);

  const logoById = new Map(logos.map((l) => [l.id, l]));

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
            Zwerfkattenbeleid
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} campagne{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/beheerder/rapporten/zwerfkatten"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            title="R14 — Zwerfkattenbeleid rapport"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h6m-3-4l3 4-3 4M3 7h6a4 4 0 014 4v8" />
            </svg>
            R14 — Rapport
          </Link>
          <Link
            href="/beheerder/dieren/zwerfkattenbeleid/opdrachtgevers"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Beheer Opdrachtgevers
          </Link>
          <Link
            href="/beheerder/dieren/zwerfkattenbeleid/kooien"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Beheer Kooien
          </Link>
          <Link
            href="/beheerder/dieren/zwerfkattenbeleid/nieuw"
            className="rounded-lg bg-[#1b4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f]"
          >
            + Nieuwe campagne
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-gray-100" />}>
          <CampaignFilters municipalities={municipalities} />
        </Suspense>
      </div>

      <CampaignTable campaigns={campaigns} logoById={Object.fromEntries(logoById)} />

      {totalPages > 1 && (
        <div className="mt-4">
          <Suspense fallback={<div className="h-8 animate-pulse rounded-lg bg-gray-100" />}>
            <Pagination currentPage={page} totalPages={totalPages} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
