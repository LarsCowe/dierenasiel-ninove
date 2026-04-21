"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { speciesLabel, statusLabel, formatDate } from "@/lib/utils";
import type { Animal } from "@/types";

interface AnimalTableProps {
  animals: Animal[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

const STATUS_COLORS: Record<string, string> = {
  beschikbaar: "bg-emerald-100 text-emerald-800",
  gereserveerd: "bg-blue-100 text-blue-800",
  in_behandeling: "bg-amber-100 text-amber-800",
  geadopteerd: "bg-purple-100 text-purple-800",
};

interface Column {
  key: string;
  label: string;
  sortable: boolean;
}

const COLUMNS: Column[] = [
  { key: "name", label: "Naam", sortable: true },
  { key: "species", label: "Soort", sortable: true },
  { key: "breed", label: "Ras", sortable: false },
  { key: "status", label: "Status", sortable: true },
  { key: "isAvailableForAdoption", label: "Ter adoptie", sortable: false },
  { key: "kennelId", label: "Kennel", sortable: false },
  { key: "intakeDate", label: "Intake datum", sortable: true },
];

export default function AnimalTable({ animals, sortBy, sortDir }: AnimalTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSort(columnKey: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (sortBy === columnKey && sortDir === "asc") {
      params.set("sorteer", columnKey);
      params.set("richting", "desc");
    } else {
      params.set("sorteer", columnKey);
      params.set("richting", "asc");
    }
    params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  }

  function getSortIndicator(columnKey: string) {
    if (sortBy !== columnKey) return null;
    return sortDir === "asc" ? " \u2191" : " \u2193";
  }

  if (animals.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Geen dieren gevonden. Pas de filters aan of registreer een nieuw dier.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 ${
                  col.sortable ? "cursor-pointer select-none hover:text-gray-700" : ""
                }`}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                {col.label}
                {col.sortable && getSortIndicator(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {animals.map((animal) => (
            <tr key={animal.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                <Link
                  href={`/beheerder/dieren/${animal.id}`}
                  className="text-[#1b4332] hover:underline"
                >
                  {animal.name}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                {speciesLabel(animal.species)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                {animal.breed || "\u2014"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    STATUS_COLORS[animal.status ?? ""] ?? "bg-gray-100 text-gray-800"
                  }`}
                >
                  {statusLabel(animal.status ?? "")}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    animal.isAvailableForAdoption
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {animal.isAvailableForAdoption ? "Ja" : "Nee"}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                {animal.kennelId ?? "\u2014"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                {animal.intakeDate ? formatDate(animal.intakeDate) : "\u2014"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
