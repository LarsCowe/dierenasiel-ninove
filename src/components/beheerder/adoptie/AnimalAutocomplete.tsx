"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface CandidateOption {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  rijksregister: string;
  status: string;
}

export interface AnimalOption {
  id: number;
  name: string;
  species: string;
  breed: string;
  birthDate: string;
  gender: string;
  color: string;
  identificationNr: string;
  passportNr: string;
  description: string;
  isNeutered: boolean;
  candidates: CandidateOption[];
}

interface Props {
  animals: AnimalOption[];
  onSelect: (animal: AnimalOption) => void;
  selected: AnimalOption | null;
}

export default function AnimalAutocomplete({ animals, onSelect, selected }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return animals.slice(0, 20);
    const q = query.toLowerCase();
    return animals
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.breed.toLowerCase().includes(q) ||
          a.species.toLowerCase().includes(q) ||
          a.identificationNr.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [animals, query]);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-[11px] font-medium uppercase text-gray-500">Zoek dier *</label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={selected ? `${selected.name} (${selected.species})` : "Naam, ras, chip-nr..."}
        className="mt-0.5 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
      />

      {selected && (
        <p className="mt-1 text-xs text-emerald-700">
          Gekozen: <strong>{selected.name}</strong> — {selected.breed || selected.species}
        </p>
      )}

      {open && filtered.length > 0 && (
        <ul className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {filtered.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(a);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-emerald-50"
              >
                <span>
                  <span className="font-medium text-gray-800">{a.name}</span>
                  {a.breed && <span className="ml-2 text-xs text-gray-500">{a.breed}</span>}
                </span>
                <span className="text-[10px] uppercase text-gray-400">{a.species}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute left-0 right-0 z-20 mt-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 shadow-lg">
          Geen dieren gevonden voor &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
