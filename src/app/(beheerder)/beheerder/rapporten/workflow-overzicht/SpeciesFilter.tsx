"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SPECIES_LABELS } from "@/lib/constants";

export default function SpeciesFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const soort = searchParams.get("soort") ?? "";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("soort", value);
    } else {
      params.delete("soort");
    }
    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      id="soort"
      value={soort}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    >
      <option value="">Alle soorten</option>
      {Object.entries(SPECIES_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
