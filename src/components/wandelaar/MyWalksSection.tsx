"use client";

import { useState, useTransition } from "react";
import { checkInWalk, checkOutWalk } from "@/lib/actions/walks";
import { formatDate } from "@/lib/utils";
import type { Walk } from "@/types";

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  planned: { label: "Gepland", bg: "bg-blue-100", text: "text-blue-800" },
  in_progress: { label: "Bezig", bg: "bg-amber-100", text: "text-amber-800" },
  completed: { label: "Voltooid", bg: "bg-emerald-100", text: "text-emerald-800" },
  cancelled: { label: "Geannuleerd", bg: "bg-gray-100", text: "text-gray-500" },
};

interface MyWalksSectionProps {
  walks: Walk[];
}

export default function MyWalksSection({ walks }: MyWalksSectionProps) {
  const [checkOutWalkId, setCheckOutWalkId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  if (walks.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-[#2d6a4f]/70">
          Je hebt nog geen wandelingen geboekt. Kies een hond hierboven om je eerste wandeling te plannen!
        </p>
      </div>
    );
  }

  function handleCheckIn(walkId: number) {
    setMessage(null);
    startTransition(async () => {
      const result = await checkInWalk(walkId);
      if (result.success) {
        setMessage({ type: "success", text: result.message ?? "Inchecken geslaagd!" });
      } else {
        setMessage({ type: "error", text: result.error ?? "Er ging iets mis." });
      }
    });
  }

  function handleCheckOut(walkId: number) {
    setMessage(null);
    startTransition(async () => {
      const result = await checkOutWalk(walkId, remarks);
      if (result.success) {
        setMessage({ type: "success", text: result.message ?? "Uitchecken geslaagd!" });
        setCheckOutWalkId(null);
        setRemarks("");
      } else {
        setMessage({ type: "error", text: result.error ?? "Er ging iets mis." });
      }
    });
  }

  return (
    <div className="space-y-3">
      {message && (
        <div
          className={`rounded-lg p-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {walks.map((walk) => {
        const status = STATUS_LABELS[walk.status] ?? STATUS_LABELS.planned;
        const isCheckOutOpen = checkOutWalkId === walk.id;

        return (
          <div
            key={walk.id}
            className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1b4332]">
                  {formatDate(walk.date)} om {walk.startTime}
                </p>
                {walk.endTime && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    Einde: {walk.endTime} ({walk.durationMinutes} min)
                  </p>
                )}
                {walk.remarks && (
                  <p className="mt-0.5 text-xs text-gray-500">{walk.remarks}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}>
                  {status.label}
                </span>

                {walk.status === "planned" && (
                  <button
                    onClick={() => handleCheckIn(walk.id)}
                    disabled={isPending}
                    className="rounded-lg bg-[#2d6a4f] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1b4332] disabled:opacity-50"
                  >
                    {isPending ? "..." : "Inchecken"}
                  </button>
                )}

                {walk.status === "in_progress" && !isCheckOutOpen && (
                  <button
                    onClick={() => setCheckOutWalkId(walk.id)}
                    disabled={isPending}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                  >
                    Uitchecken
                  </button>
                )}
              </div>
            </div>

            {isCheckOutOpen && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <label htmlFor={`remarks-${walk.id}`} className="block text-xs font-medium text-gray-700">
                  Opmerkingen (optioneel)
                </label>
                <textarea
                  id={`remarks-${walk.id}`}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Hoe was de wandeling?"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleCheckOut(walk.id)}
                    disabled={isPending}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                  >
                    {isPending ? "Bezig..." : "Bevestig uitchecken"}
                  </button>
                  <button
                    onClick={() => { setCheckOutWalkId(null); setRemarks(""); }}
                    disabled={isPending}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
