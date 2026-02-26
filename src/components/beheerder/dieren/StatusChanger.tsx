"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeStatus } from "@/lib/actions/animals-status";
import { ANIMAL_STATUSES, MANUAL_STATUSES, type AnimalStatus } from "@/lib/validations/animals-status";

const STATUS_LABELS: Record<AnimalStatus, string> = {
  beschikbaar: "Beschikbaar",
  in_behandeling: "In behandeling",
  gereserveerd: "Gereserveerd",
  geadopteerd: "Geadopteerd",
  terug_eigenaar: "Terug naar eigenaar",
  geeuthanaseerd: "Geëuthanaseerd",
};

const STATUS_COLORS: Record<AnimalStatus, string> = {
  beschikbaar: "bg-emerald-100 text-emerald-800",
  in_behandeling: "bg-amber-100 text-amber-800",
  gereserveerd: "bg-blue-100 text-blue-800",
  geadopteerd: "bg-purple-100 text-purple-800",
  terug_eigenaar: "bg-gray-100 text-gray-800",
  geeuthanaseerd: "bg-red-100 text-red-800",
};

interface StatusChangerProps {
  animalId: number;
  currentStatus: string;
}

export function StatusBadge({ status }: { status: string }) {
  const s = status as AnimalStatus;
  const label = STATUS_LABELS[s] ?? status;
  const color = STATUS_COLORS[s] ?? "bg-gray-100 text-gray-800";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

export default function StatusChanger({ animalId, currentStatus }: StatusChangerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;

    setError(null);
    startTransition(async () => {
      const result = await changeStatus(animalId, newStatus);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Er ging iets mis");
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label htmlFor="status-select" className="text-sm font-medium text-gray-700">
          Status
        </label>
        <StatusBadge status={currentStatus} />
      </div>
      <select
        id="status-select"
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {MANUAL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s as AnimalStatus]}
          </option>
        ))}
      </select>
      {isPending && <p className="text-xs text-gray-400">Status bijwerken...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
