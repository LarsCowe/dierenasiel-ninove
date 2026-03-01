import { Suspense } from "react";
import Link from "next/link";
import { getCampaignsForAdmin, getDistinctMunicipalities } from "@/lib/queries/stray-cat-campaigns";
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

  const [{ campaigns, total }, municipalities] = await Promise.all([
    getCampaignsForAdmin({
      municipality: params.gemeente,
      status: params.status,
      dateFrom: params.van,
      dateTo: params.tot,
      page,
      pageSize: PAGE_SIZE,
    }),
    getDistinctMunicipalities(),
  ]);

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
        <Link
          href="/beheerder/dieren/zwerfkattenbeleid/nieuw"
          className="rounded-lg bg-[#1b4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f]"
        >
          + Nieuw verzoek
        </Link>
      </div>

      <div className="mb-4">
        <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-gray-100" />}>
          <CampaignFilters municipalities={municipalities} />
        </Suspense>
      </div>

      <CampaignTable campaigns={campaigns} />

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
