"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignKennel } from "@/lib/actions/kennels";
import type { Kennel } from "@/types";

interface KennelSelectorProps {
  animalId: number;
  currentKennelId: number | null;
  kennels: Kennel[];
}

export default function KennelSelector({
  animalId,
  currentKennelId,
  kennels,
}: KennelSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const kennelId = value === "" ? null : Number(value);

    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await assignKennel(animalId, kennelId);
      if (result.success) {
        if (result.message) {
          setMessage(result.message);
        } else {
          setMessage(
            kennelId
              ? `Toegewezen aan kennel ${kennels.find((k) => k.id === kennelId)?.code}`
              : "Kennel toewijzing verwijderd",
          );
        }
        router.refresh();
      } else {
        setError(result.error ?? "Er ging iets mis");
      }
    });
  }

  // Group kennels by zone
  const grouped = kennels.reduce(
    (acc, k) => {
      if (!acc[k.zone]) acc[k.zone] = [];
      acc[k.zone].push(k);
      return acc;
    },
    {} as Record<string, Kennel[]>,
  );

  const zoneLabels: Record<string, string> = {
    honden: "Honden",
    katten: "Katten",
    andere: "Andere",
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="kennel-select"
        className="text-sm font-medium text-gray-700"
      >
        Kennel
      </label>
      <select
        id="kennel-select"
        value={currentKennelId ?? ""}
        onChange={handleChange}
        disabled={isPending}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">— Geen kennel —</option>
        {Object.entries(grouped).map(([zone, list]) => (
          <optgroup key={zone} label={zoneLabels[zone] ?? zone}>
            {list.map((k) => (
              <option key={k.id} value={k.id}>
                {k.code}
                {k.notes ? ` (${k.notes})` : ""}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {isPending && (
        <p className="text-xs text-gray-400">Bezig met toewijzen...</p>
      )}
      {message && (
        <p className={`text-xs ${message.startsWith("Let op") ? "text-amber-600" : "text-emerald-600"}`}>
          {message}
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
