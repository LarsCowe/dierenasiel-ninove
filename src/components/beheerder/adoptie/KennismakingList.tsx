"use client";

import { useState } from "react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerKennismakingOutcome } from "@/lib/actions/kennismakingen";
import type { Kennismaking } from "@/types";

interface Props {
  kennismakingen: Kennismaking[];
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Gepland", className: "bg-blue-100 text-blue-800" },
  completed: { label: "Afgerond", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Geannuleerd", className: "bg-gray-100 text-gray-800" },
};

const OUTCOME_LABELS: Record<string, { label: string; className: string }> = {
  positief: { label: "Positief", className: "text-emerald-700" },
  twijfel: { label: "Twijfel", className: "text-amber-700" },
};

export default function KennismakingList({ kennismakingen }: Props) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [outcomeState, outcomeAction, outcomePending] = useActionState(registerKennismakingOutcome, null);

  useEffect(() => {
    if (outcomeState?.success) {
      setActiveId(null);
      router.refresh();
    }
  }, [outcomeState, router]);

  if (kennismakingen.length === 0) {
    return (
      <p className="text-sm text-gray-400">Nog geen kennismakingen gepland.</p>
    );
  }

  function handleOutcome(kennismakingId: number, outcome: string) {
    const notes = prompt(outcome === "twijfel" ? "Reden voor twijfel:" : "Opmerkingen (optioneel):") ?? "";
    const fd = new FormData();
    fd.append("json", JSON.stringify({ id: kennismakingId, outcome, notes }));
    setActiveId(kennismakingId);
    outcomeAction(fd);
  }

  return (
    <div className="space-y-3">
      {outcomeState && !outcomeState.success && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{outcomeState.error}</p>
        </div>
      )}

      {kennismakingen.map((k) => {
        const statusBadge = STATUS_LABELS[k.status] ?? STATUS_LABELS.scheduled;
        const outcomeBadge = k.outcome ? OUTCOME_LABELS[k.outcome] : null;
        return (
          <div key={k.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
                {outcomeBadge && (
                  <span className={`text-xs font-semibold ${outcomeBadge.className}`}>
                    {outcomeBadge.label}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {new Date(k.scheduledAt).toLocaleString("nl-BE", {
                  day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>

            {k.location && (
              <p className="mt-2 text-xs text-gray-500">Locatie: {k.location}</p>
            )}

            {k.notes && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{k.notes}</p>
            )}

            {k.createdBy && (
              <p className="mt-1 text-xs text-gray-400">Gepland door {k.createdBy}</p>
            )}

            {k.status === "scheduled" && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={outcomePending && activeId === k.id}
                  onClick={() => handleOutcome(k.id, "positief")}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Positief
                </button>
                <button
                  type="button"
                  disabled={outcomePending && activeId === k.id}
                  onClick={() => handleOutcome(k.id, "twijfel")}
                  className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                >
                  Twijfel
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
