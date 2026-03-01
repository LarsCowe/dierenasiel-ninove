"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function AnimalFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const dier = searchParams.get("dier") ?? "";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("dier", value);
    } else {
      params.delete("dier");
    }
    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <input
      type="text"
      id="dier"
      value={dier}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="ID..."
      className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    />
  );
}
