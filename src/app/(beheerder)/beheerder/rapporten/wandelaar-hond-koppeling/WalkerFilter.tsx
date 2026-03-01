"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function WalkerFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const wandelaar = searchParams.get("wandelaar") ?? "";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("wandelaar", value);
    } else {
      params.delete("wandelaar");
    }
    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <input
      type="text"
      id="wandelaar"
      value={wandelaar}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="ID..."
      className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    />
  );
}
