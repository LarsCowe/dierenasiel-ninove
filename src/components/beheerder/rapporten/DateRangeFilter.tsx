"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

interface DateRangeFilterProps {
  locationFilter?: boolean;
}

export default function DateRangeFilter({ locationFilter }: DateRangeFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const van = searchParams.get("van") ?? "";
  const tot = searchParams.get("tot") ?? "";
  const locatie = searchParams.get("locatie") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("pagina");
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname],
  );

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <label htmlFor="van" className="block text-xs font-medium text-gray-600 mb-1">
          Van
        </label>
        <input
          type="date"
          id="van"
          value={van}
          onChange={(e) => updateParam("van", e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label htmlFor="tot" className="block text-xs font-medium text-gray-600 mb-1">
          Tot
        </label>
        <input
          type="date"
          id="tot"
          value={tot}
          onChange={(e) => updateParam("tot", e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      {locationFilter && (
        <div>
          <label htmlFor="locatie" className="block text-xs font-medium text-gray-600 mb-1">
            Locatie
          </label>
          <select
            id="locatie"
            value={locatie}
            onChange={(e) => updateParam("locatie", e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Alle locaties</option>
            <option value="in_asiel">In asiel</option>
            <option value="in_praktijk">In praktijk</option>
          </select>
        </div>
      )}
      {(van || tot || locatie) && (
        <button
          onClick={() => router.push(pathname)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Filters wissen
        </button>
      )}
    </div>
  );
}
