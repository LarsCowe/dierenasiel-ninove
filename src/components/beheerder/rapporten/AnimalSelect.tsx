"use client";

import { useRouter, usePathname } from "next/navigation";

interface AnimalOption {
  id: number;
  name: string;
  breed: string | null;
}

interface AnimalSelectProps {
  animals: AnimalOption[];
  selectedId?: string;
}

export default function AnimalSelect({ animals, selectedId }: AnimalSelectProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(value: string) {
    if (value) {
      router.push(`${pathname}?dier=${value}`);
    } else {
      router.push(pathname);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Selecteer een hond</label>
      <select
        value={selectedId ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
      >
        <option value="">— Kies een hond —</option>
        {animals.map((animal) => (
          <option key={animal.id} value={String(animal.id)}>
            {animal.name} {animal.breed ? `(${animal.breed})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
