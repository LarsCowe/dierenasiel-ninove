"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function PaymentMethodFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const betaalwijze = searchParams.get("betaalwijze") ?? "";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("betaalwijze", value);
    } else {
      params.delete("betaalwijze");
    }
    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      id="betaalwijze"
      value={betaalwijze}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    >
      <option value="">Alle</option>
      <option value="cash">Cash</option>
      <option value="payconiq">Payconiq</option>
      <option value="overschrijving">Overschrijving</option>
    </select>
  );
}
