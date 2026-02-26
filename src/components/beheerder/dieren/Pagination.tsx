"use client";

import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  function buildPageUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("pagina");
    } else {
      params.set("pagina", String(page));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  // Generate page numbers to show (max 5 around current)
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav className="flex items-center justify-between">
      <p className="text-sm text-gray-500">
        Pagina {currentPage} van {totalPages}
      </p>
      <div className="flex items-center gap-1">
        {/* Vorige */}
        {currentPage > 1 ? (
          <Link
            href={buildPageUrl(currentPage - 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Vorige
          </Link>
        ) : (
          <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-400">
            Vorige
          </span>
        )}

        {/* Paginanummers */}
        {pages.map((page) => (
          <Link
            key={page}
            href={buildPageUrl(page)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              page === currentPage
                ? "bg-[#1b4332] text-white"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {page}
          </Link>
        ))}

        {/* Volgende */}
        {currentPage < totalPages ? (
          <Link
            href={buildPageUrl(currentPage + 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Volgende
          </Link>
        ) : (
          <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-400">
            Volgende
          </span>
        )}
      </div>
    </nav>
  );
}
