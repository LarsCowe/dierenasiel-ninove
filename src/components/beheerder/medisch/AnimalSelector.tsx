"use client";

import { useState } from "react";
import type { Animal } from "@/types";

interface AnimalSelectorProps {
  shelterAnimals: Pick<Animal, "id" | "name" | "species" | "identificationNr">[];
  onSelect: (animal: { animalId: number; animalName: string; species: string; chipNr: string | null }) => void;
  label?: string;
}

export default function AnimalSelector({ shelterAnimals, onSelect, label = "Dier selecteren" }: AnimalSelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? shelterAnimals.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.species.toLowerCase().includes(search.toLowerCase()) ||
          (a.identificationNr && a.identificationNr.toLowerCase().includes(search.toLowerCase())),
      )
    : shelterAnimals;

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      <input
        type="text"
        placeholder="Zoek op naam, soort of chipnr..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
      />
      {search && filtered.length > 0 && (
        <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-sm">
          {filtered.slice(0, 10).map((animal) => (
            <button
              key={animal.id}
              type="button"
              onClick={() => {
                onSelect({
                  animalId: animal.id,
                  animalName: animal.name,
                  species: animal.species,
                  chipNr: animal.identificationNr || null,
                });
                setSearch("");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-emerald-50"
            >
              <span className="font-medium text-gray-800">{animal.name}</span>
              <span className="text-xs text-gray-500">{animal.species}</span>
              {animal.identificationNr && (
                <span className="text-xs text-gray-400">{animal.identificationNr}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {search && filtered.length === 0 && (
        <p className="mt-1 text-xs text-gray-400">Geen dieren gevonden.</p>
      )}
    </div>
  );
}
