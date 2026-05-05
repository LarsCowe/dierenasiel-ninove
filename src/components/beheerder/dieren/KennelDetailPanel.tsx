"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { assignKennel } from "@/lib/actions/kennels";
import type { Animal, Kennel } from "@/types";

function getZoneLabel(zone: string): string {
  switch (zone) {
    case "honden": return "Honden";
    case "katten": return "Katten";
    case "andere": return "Andere";
    default: return zone;
  }
}

interface Props {
  kennel: Kennel;
  animals: Animal[];
  allAnimals: Animal[];
  onClose: () => void;
}

export default function KennelDetailPanel({ kennel, animals, allAnimals, onClose }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-bold text-[#1b4332]">
          Kennel {kennel.code}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({getZoneLabel(kennel.zone)})
          </span>
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Detail paneel sluiten"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Sluiten
        </button>
      </div>

      <p className="mt-1 text-sm text-gray-600">
        Bezetting: {animals.length} / {kennel.capacity}
        {kennel.notes && (
          <span className="ml-2 italic text-gray-400">— {kennel.notes}</span>
        )}
      </p>

      {animals.length > 0 ? (
        <ul className="mt-3 divide-y divide-gray-100">
          {animals.map((animal) => (
            <AnimalRow key={animal.id} animal={animal} kennelCode={kennel.code} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-gray-400">Deze kennel is leeg.</p>
      )}

      <div className="mt-3 border-t border-gray-100 pt-3">
        <AddAnimalSection
          kennelId={kennel.id}
          kennelCode={kennel.code}
          animals={allAnimals}
        />
      </div>
    </div>
  );
}

function AnimalRow({ animal, kennelCode }: { animal: Animal; kennelCode: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    if (!confirm(`${animal.name} verwijderen uit kennel ${kennelCode}?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await assignKennel(animal.id, null);
      if (!result.success) {
        setError(result.error || "Verwijderen mislukt");
      }
    });
  }

  return (
    <li className="flex items-center gap-3 py-2">
      {animal.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={animal.imageUrl}
          alt={animal.name}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-lg">
          {animal.species === "hond" ? "🐕" : animal.species === "kat" ? "🐈" : "🐾"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <Link
          href={`/beheerder/dieren/${animal.id}`}
          className="text-sm font-medium text-[#1b4332] hover:underline"
        >
          {animal.name}
        </Link>
        <p className="text-xs text-gray-500">
          {animal.breed || animal.species} — {animal.gender}
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        aria-label={`${animal.name} verwijderen uit kennel`}
        title="Uit kennel verwijderen"
        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        {isPending ? (
          <span className="text-[10px]">...</span>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>
    </li>
  );
}

function AddAnimalSection({
  kennelId,
  kennelCode,
  animals,
}: {
  kennelId: number;
  kennelCode: string;
  animals: Animal[];
}) {
  const [open, setOpen] = useState(false);
  const [animalId, setAnimalId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!animalId) {
      setError("Selecteer een dier");
      return;
    }
    startTransition(async () => {
      const result = await assignKennel(Number(animalId), kennelId);
      if (!result.success) {
        setError(result.error || "Toewijzing mislukt");
      } else {
        setSuccess(result.message || "Dier toegevoegd");
        setAnimalId("");
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setError(null);
            setSuccess(null);
          }}
          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
        >
          + Dier toevoegen aan kennel {kennelCode}
        </button>
        {success && <p className="text-xs text-emerald-600">{success}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-amber-800">
          Dier toevoegen aan kennel {kennelCode}
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Annuleren
        </button>
      </div>
      <select
        value={animalId}
        onChange={(e) => setAnimalId(e.target.value)}
        className="block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-amber-500 focus:ring-amber-500"
      >
        <option value="">Kies een dier...</option>
        {animals.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
            {a.breed ? ` — ${a.breed}` : a.species ? ` — ${a.species}` : ""}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending || !animalId}
        className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
      >
        {isPending ? "Bezig..." : "Toevoegen"}
      </button>
    </form>
  );
}
