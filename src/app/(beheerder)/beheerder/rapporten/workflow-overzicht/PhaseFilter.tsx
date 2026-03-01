"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { WORKFLOW_PHASES } from "@/lib/workflow/phases";
import { PHASE_LABELS } from "@/lib/workflow/stepbar";

export default function PhaseFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const fase = searchParams.get("fase") ?? "";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("fase", value);
    } else {
      params.delete("fase");
    }
    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      id="fase"
      value={fase}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    >
      <option value="">Alle fases</option>
      {WORKFLOW_PHASES.map((phase) => (
        <option key={phase} value={phase}>
          {PHASE_LABELS[phase] ?? phase}
        </option>
      ))}
    </select>
  );
}
