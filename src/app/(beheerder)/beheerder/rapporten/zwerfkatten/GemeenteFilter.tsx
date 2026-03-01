"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface Props {
  municipalities: string[];
}

export default function GemeenteFilter({ municipalities }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  function updateGemeente(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("gemeente", value);
    } else {
      params.delete("gemeente");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div>
      <label htmlFor="gemeente" className="mb-1 block text-xs font-medium text-gray-600">
        Gemeente
      </label>
      <select
        id="gemeente"
        value={searchParams.get("gemeente") ?? ""}
        onChange={(e) => updateGemeente(e.target.value)}
        className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        <option value="">Alle gemeenten</option>
        {municipalities.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}
