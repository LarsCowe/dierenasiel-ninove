"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleAdoptionAvailability } from "@/lib/actions/animals-status";

interface AdoptionToggleProps {
  animalId: number;
  isAvailable: boolean;
}

export default function AdoptionToggle({ animalId, isAvailable }: AdoptionToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.checked;
    setError(null);

    startTransition(async () => {
      const result = await toggleAdoptionAvailability(animalId, newValue);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Er ging iets mis");
      }
    });
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          id="adoption-toggle"
          type="checkbox"
          checked={isAvailable}
          onChange={handleChange}
          disabled={isPending}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span className="text-sm font-medium text-gray-700">
          Beschikbaar voor adoptie
        </span>
      </label>
      {isAvailable && (
        <p className="text-xs text-emerald-600">
          Dit dier is zichtbaar voor adoptie-aanvragen
        </p>
      )}
      {isPending && <p className="text-xs text-gray-400">Bijwerken...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
