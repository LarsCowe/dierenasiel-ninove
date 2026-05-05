"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "alle", label: "Alle statussen" },
  { value: "draft", label: "Concept" },
  { value: "klaar_voor_handtekening", label: "Klaar voor handtekening" },
  { value: "verzonden_voor_digitale_handtekening", label: "Verzonden (digitaal)" },
  { value: "getekend", label: "Getekend" },
  { value: "geannuleerd", label: "Geannuleerd" },
];

export default function AdoptionContractFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "alle";
  const search = searchParams.get("zoek") ?? "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "contracten");
    if (value && value !== "alle" && value !== "") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <div>
        <label htmlFor="status" className="block text-xs font-medium text-gray-600">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => update("status", e.target.value)}
          className="mt-0.5 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-[180px]">
        <label htmlFor="zoek" className="block text-xs font-medium text-gray-600">
          Zoeken (adoptant of dier)
        </label>
        <input
          id="zoek"
          type="search"
          defaultValue={search}
          onBlur={(e) => update("zoek", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") update("zoek", e.currentTarget.value);
          }}
          placeholder="Naam..."
          className="mt-0.5 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>
    </div>
  );
}
