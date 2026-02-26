"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const SPECIES_OPTIONS = [
  { value: "", label: "Alle soorten" },
  { value: "hond", label: "Hond" },
  { value: "kat", label: "Kat" },
  { value: "ander", label: "Ander" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Alle statussen" },
  { value: "beschikbaar", label: "Beschikbaar" },
  { value: "gereserveerd", label: "Gereserveerd" },
  { value: "in_behandeling", label: "In behandeling" },
  { value: "geadopteerd", label: "Geadopteerd" },
];

export default function AnimalFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(searchParams.get("zoek") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Sync search input when URL changes externally (e.g. reset)
  useEffect(() => {
    setSearchValue(searchParams.get("zoek") ?? "");
  }, [searchParams]);

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

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParam("zoek", value);
    }, 300);
  }

  function resetFilters() {
    setSearchValue("");
    router.push(pathname);
  }

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Zoekveld */}
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Zoek op naam of chipnummer..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>

      {/* Soort filter */}
      <select
        value={searchParams.get("soort") ?? ""}
        onChange={(e) => updateParam("soort", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
      >
        {SPECIES_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

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
