"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function ZoneFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const zone = searchParams.get("zone") ?? "";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("zone", value);
    } else {
      params.delete("zone");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      id="zone"
      value={zone}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    >
      <option value="">Alle zones</option>
      <option value="honden">Honden</option>
      <option value="katten">Katten</option>
      <option value="andere">Andere</option>
    </select>
  );
}
