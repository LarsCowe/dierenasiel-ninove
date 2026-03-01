"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CAMPAIGN_STATUSES, CAMPAIGN_STATUS_LABELS } from "@/lib/constants";

interface Props {
  municipalities: string[];
}

export default function CampaignFilters({ municipalities }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  }

  function resetFilters() {
    router.push(pathname);
  }

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Gemeente filter */}
      <select
        value={searchParams.get("gemeente") ?? ""}
        onChange={(e) => updateParam("gemeente", e.target.value)}
        aria-label="Filter op gemeente"
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
      >
        <option value="">Alle gemeenten</option>
        {municipalities.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        aria-label="Filter op status"
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
      >
        <option value="">Alle statussen</option>
        {CAMPAIGN_STATUSES.map((s) => (
          <option key={s} value={s}>{CAMPAIGN_STATUS_LABELS[s]}</option>
        ))}
      </select>

      {/* Periode van */}
      <input
        type="date"
        value={searchParams.get("van") ?? ""}
        onChange={(e) => updateParam("van", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
        aria-label="Periode van"
      />

      {/* Periode tot */}
      <input
        type="date"
        value={searchParams.get("tot") ?? ""}
        onChange={(e) => updateParam("tot", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
        aria-label="Periode tot"
      />

      {/* Reset knop */}
      {hasFilters && (
        <button
          onClick={resetFilters}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Filters wissen
        </button>
      )}
    </div>
  );
}
