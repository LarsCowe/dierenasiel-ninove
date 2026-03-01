"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Kennel } from "@/types";

const SPECIES_OPTIONS = [
  { value: "", label: "Alle soorten" },
  { value: "hond", label: "Hond" },
  { value: "kat", label: "Kat" },
  { value: "konijn", label: "Konijn" },
  { value: "cavia", label: "Cavia" },
  { value: "ezel", label: "Ezel" },
  { value: "kip", label: "Kip" },
  { value: "hangbuikvarken", label: "Hangbuikvarken" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Alle statussen" },
  { value: "beschikbaar", label: "Beschikbaar" },
  { value: "gereserveerd", label: "Gereserveerd" },
  { value: "geadopteerd", label: "Geadopteerd" },
  { value: "in_behandeling", label: "In behandeling" },
];

const PHASE_OPTIONS = [
  { value: "", label: "Alle fases" },
  { value: "intake", label: "Intake" },
  { value: "registratie", label: "Registratie" },
  { value: "medisch", label: "Medisch" },
  { value: "verblijf", label: "Verblijf" },
  { value: "adoptie", label: "Adoptie" },
  { value: "afgerond", label: "Afgerond" },
];

interface ReportFiltersProps {
  kennels: Kennel[];
}

export default function ReportFilters({ kennels }: ReportFiltersProps) {
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

  const selectClass = "rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={searchParams.get("soort") ?? ""}
        onChange={(e) => updateParam("soort", e.target.value)}
        className={selectClass}
      >
        {SPECIES_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className={selectClass}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select
        value={searchParams.get("kennel") ?? ""}
        onChange={(e) => updateParam("kennel", e.target.value)}
        className={selectClass}
      >
        <option value="">Alle kennels</option>
        {kennels.map((k) => (
          <option key={k.id} value={String(k.id)}>{k.code} ({k.zone})</option>
        ))}
      </select>

      <select
        value={searchParams.get("fase") ?? ""}
        onChange={(e) => updateParam("fase", e.target.value)}
        className={selectClass}
      >
        {PHASE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

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
