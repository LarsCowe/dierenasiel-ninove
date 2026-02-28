"use client";

import { useState } from "react";
import type { Animal } from "@/types";

interface Props {
  animals: Pick<Animal, "id" | "name" | "species" | "identificationNr">[];
  selectedAnimalId?: number;
  onSelect: (animalId: number) => void;
}

export default function AdoptionAnimalSelector({ animals, selectedAnimalId, onSelect }: Props) {
  const [search, setSearch] = useState("");

  const selected = animals.find((a) => a.id === selectedAnimalId);

  const filtered = search
    ? animals.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.species.toLowerCase().includes(search.toLowerCase()) ||
          (a.identificationNr && a.identificationNr.toLowerCase().includes(search.toLowerCase())),
      )
    : animals;

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600">
        Dier <span className="text-red-500">*</span>
      </label>
      {selected && (
        <div className="mt-1 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
          <span className="text-sm font-medium text-gray-800">{selected.name}</span>
          <span className="text-xs text-gray-500">{selected.species}</span>
          {selected.identificationNr && (
            <span className="text-xs text-gray-400">{selected.identificationNr}</span>
          )}
          <button
            type="button"
            onClick={() => {
              onSelect(0);
              setSearch("");
            }}
            className="ml-auto text-xs text-red-500 hover:text-red-700"
          >
            Wijzigen
          </button>
        </div>
      )}
      {!selected && (
        <>
          <input
            type="text"
            placeholder="Zoek op naam, soort of chipnr..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
          {filtered.length > 0 && (
            <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-sm">
              {filtered.slice(0, 10).map((animal) => (
                <button
                  key={animal.id}
                  type="button"
                  onClick={() => {
                    onSelect(animal.id);
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
            <p className="mt-1 text-xs text-gray-400">Geen beschikbare dieren gevonden.</p>
          )}
        </>
      )}
    </div>
  );
}
