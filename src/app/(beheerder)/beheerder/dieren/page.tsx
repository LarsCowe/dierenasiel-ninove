import { Suspense } from "react";
import Link from "next/link";
import { getAnimalsForAdmin } from "@/lib/queries/animals";
import AnimalFilters from "@/components/beheerder/dieren/AnimalFilters";
import AnimalTable from "@/components/beheerder/dieren/AnimalTable";
import Pagination from "@/components/beheerder/dieren/Pagination";

interface Props {
  searchParams: Promise<{
    zoek?: string;
    soort?: string;
    status?: string;
    pagina?: string;
    sorteer?: string;
    richting?: string;
  }>;
}

const PAGE_SIZE = 25;

function parseSortDir(value?: string): "asc" | "desc" | undefined {
  if (value === "asc" || value === "desc") return value;
  return undefined;
}

export default async function DierenOverzichtPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.pagina) || 1);
  const sortDir = parseSortDir(params.richting);

  const { animals, total } = await getAnimalsForAdmin({
    search: params.zoek,
    species: params.soort,
    status: params.status,
    page,
    pageSize: PAGE_SIZE,
    sortBy: params.sorteer,
    sortDir,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
            Dieren
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} {total === 1 ? "dier" : "dieren"} in het register.
          </p>
        </div>
        <Link
          href="/beheerder/dieren/nieuw"
          className="rounded-lg bg-[#1b4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f]"
        >
          + Nieuw dier registreren
        </Link>
      </div>

      <div className="mt-6">
        <Suspense>
          <AnimalFilters />
        </Suspense>
      </div>

      <div className="mt-4 rounded-xl border border-gray-100 bg-white shadow-sm">
        <Suspense>
          <AnimalTable
            animals={animals}
            sortBy={params.sorteer}
            sortDir={sortDir}
          />
        </Suspense>
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Suspense>
            <Pagination currentPage={page} totalPages={totalPages} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
