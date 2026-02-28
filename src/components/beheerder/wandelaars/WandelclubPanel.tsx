"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateWalkingClubThreshold } from "@/lib/actions/shelter-settings";
import type { Walker } from "@/types";

interface WandelclubPanelProps {
  members: Walker[];
  nearThreshold: Walker[];
  threshold: number;
  lastWalkDates: Record<number, string>;
}

function ThresholdForm({ currentThreshold }: { currentThreshold: number }) {
  const [value, setValue] = useState(String(currentThreshold));
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) {
      setMessage({ type: "error", text: "Drempel moet een positief getal zijn." });
      return;
    }

    startTransition(async () => {
      const result = await updateWalkingClubThreshold(num);
      if (result.success) {
        setMessage({ type: "success", text: result.message || "Drempel bijgewerkt." });
      } else {
        setMessage({ type: "error", text: result.error || "Fout bij bijwerken." });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div>
        <label htmlFor="threshold" className="block text-xs font-medium text-gray-500">
          Drempel (aantal wandelingen)
        </label>
        <input
          id="threshold"
          type="number"
          min="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
      >
        {isPending ? "Opslaan..." : "Opslaan"}
      </button>
      {message && (
        <span className={`text-xs ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
          {message.text}
        </span>
      )}
    </form>
  );
}

function WalkerRow({ walker, lastWalkDate }: { walker: Walker; lastWalkDate: string | null }) {
  return (
    <tr>
      <td className="px-4 py-3">
        <Link
          href={`/beheerder/wandelaars/${walker.id}`}
          className="font-medium text-[#1b4332] hover:underline"
        >
          {walker.firstName} {walker.lastName}
        </Link>
      </td>
      <td className="px-4 py-3 text-gray-600">{walker.email}</td>
      <td className="px-4 py-3 text-center font-mono text-gray-700">{walker.walkCount}</td>
      <td className="px-4 py-3 text-gray-600">
        {lastWalkDate
          ? new Date(lastWalkDate).toLocaleDateString("nl-BE")
          : "—"}
      </td>
    </tr>
  );
}

export default function WandelclubPanel({ members, nearThreshold, threshold, lastWalkDates }: WandelclubPanelProps) {
  return (
    <div className="space-y-6">
      {/* Threshold config (AC3) */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="font-heading text-sm font-bold text-[#1b4332]">Wandelclub drempel</h3>
        <p className="mt-1 text-xs text-gray-500">
          Wandelaars die dit aantal wandelingen bereiken worden automatisch lid van de wandelclub.
        </p>
        <div className="mt-3">
          <ThresholdForm currentThreshold={threshold} />
        </div>
      </div>

      {/* Club members (AC2) */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
          <h3 className="font-heading text-sm font-bold text-[#1b4332]">
            Wandelclub leden ({members.length})
          </h3>
        </div>
        {members.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-gray-500">
            Nog geen wandelclub leden.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-600">Naam</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Email</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-600">Wandelingen</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Laatste wandeling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((m) => (
                  <WalkerRow key={m.id} walker={m} lastWalkDate={lastWalkDates[m.id] ?? null} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Near threshold (AC2) */}
      {nearThreshold.length > 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/30 shadow-sm">
          <div className="border-b border-amber-100 bg-amber-50 px-5 py-3">
            <h3 className="font-heading text-sm font-bold text-amber-800">
              Bijna in aanmerking ({nearThreshold.length})
            </h3>
            <p className="mt-0.5 text-xs text-amber-600">
              Wandelaars met &ge;{Math.floor(threshold * 0.8)} wandelingen (80% van drempel)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-amber-100 bg-amber-50/50">
                <tr>
                  <th className="px-4 py-2 font-medium text-amber-700">Naam</th>
                  <th className="px-4 py-2 font-medium text-amber-700">Email</th>
                  <th className="px-4 py-2 text-center font-medium text-amber-700">Wandelingen</th>
                  <th className="px-4 py-2 font-medium text-amber-700">Laatste wandeling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {nearThreshold.map((w) => (
                  <WalkerRow key={w.id} walker={w} lastWalkDate={lastWalkDates[w.id] ?? null} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
