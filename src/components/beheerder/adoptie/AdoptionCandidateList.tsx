"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { computeReviewResult } from "@/lib/utils/review-result";
import type { AdoptionCandidateWithAnimal } from "@/lib/queries/adoption-candidates";

interface Props {
  candidates: AdoptionCandidateWithAnimal[];
  activeCategory?: string;
}

const RESULT_BADGES: Record<string, { label: string; className: string }> = {
  geschikt: { label: "Geschikt", className: "bg-emerald-100 text-emerald-800" },
  niet_weerhouden: { label: "Niet weerhouden", className: "bg-red-100 text-red-800" },
  misschien: { label: "Misschien", className: "bg-amber-100 text-amber-800" },
};

const CATEGORY_OPTIONS = [
  { value: "", label: "Alle beoordelingen" },
  { value: "goede_kandidaat", label: "Goede kandidaat" },
  { value: "mogelijks", label: "Mogelijks" },
  { value: "niet_weerhouden", label: "Niet weerhouden" },
];

type SortKey = "naam" | "dier" | "beoordeling" | "datum";
type SortDir = "asc" | "desc";

const RESULT_ORDER: Record<string, number> = { geschikt: 0, misschien: 1, niet_weerhouden: 2 };

export default function AdoptionCandidateList({ candidates, activeCategory }: Props) {
  const router = useRouter();
  const [animalFilter, setAnimalFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("datum");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const uniqueAnimals = Array.from(
    new Set(candidates.map((c) => c.animalName).filter(Boolean) as string[]),
  ).sort();

  const filtered = animalFilter
    ? candidates.filter((c) => c.animalName === animalFilter)
    : candidates;

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;

    arr.sort((a, b) => {
      switch (sortKey) {
        case "naam": {
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return dir * nameA.localeCompare(nameB, "nl");
        }
        case "dier": {
          const anA = (a.animalName || "").toLowerCase();
          const anB = (b.animalName || "").toLowerCase();
          return dir * anA.localeCompare(anB, "nl");
        }
        case "beoordeling": {
          const rA = computeReviewResult(a.reviewMartine, a.reviewNathalie, a.reviewSven);
          const rB = computeReviewResult(b.reviewMartine, b.reviewNathalie, b.reviewSven);
          const oA = rA ? (RESULT_ORDER[rA] ?? 99) : 100;
          const oB = rB ? (RESULT_ORDER[rB] ?? 99) : 100;
          return dir * (oA - oB);
        }
        case "datum": {
          return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
        default:
          return 0;
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "datum" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <span className="ml-1 text-gray-300">&#8597;</span>;
    return <span className="ml-1">{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>;
  };

  const dropdownClass = "rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-emerald-500 focus:ring-emerald-500";

  return (
    <div className="space-y-4">
      {/* Filters row: 2 dropdowns + export */}
      <div className="flex flex-wrap items-center gap-3">
        {uniqueAnimals.length > 0 && (
          <select
            value={animalFilter}
            onChange={(e) => setAnimalFilter(e.target.value)}
            className={dropdownClass}
          >
            <option value="">Alle dieren</option>
            {uniqueAnimals.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}

        <select
          value={activeCategory || ""}
          onChange={(e) => {
            const val = e.target.value;
            router.push(val ? `/beheerder/adoptie?categorie=${val}` : "/beheerder/adoptie");
          }}
          className={dropdownClass}
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <a
          href="/api/export/adoption-candidates"
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </a>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            {activeCategory || animalFilter
              ? "Geen kandidaten gevonden met deze filters."
              : "Er zijn nog geen adoptie-aanvragen. Registreer een nieuwe kandidaat."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
                <th className="cursor-pointer select-none px-3 py-3 hover:text-gray-700" onClick={() => toggleSort("naam")}>
                  Naam<SortIcon column="naam" />
                </th>
                <th className="cursor-pointer select-none px-3 py-3 hover:text-gray-700" onClick={() => toggleSort("dier")}>
                  Dier<SortIcon column="dier" />
                </th>
                <th className="cursor-pointer select-none px-3 py-3 hover:text-gray-700" onClick={() => toggleSort("beoordeling")}>
                  Beoordeling<SortIcon column="beoordeling" />
                </th>
                <th className="cursor-pointer select-none px-3 py-3 hover:text-gray-700" onClick={() => toggleSort("datum")}>
                  Datum<SortIcon column="datum" />
                </th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((candidate) => {
                const reviewResult = computeReviewResult(
                  candidate.reviewMartine,
                  candidate.reviewNathalie,
                  candidate.reviewSven,
                );
                const resultBadge = reviewResult ? RESULT_BADGES[reviewResult] : null;
                const reviewCount = [candidate.reviewMartine, candidate.reviewNathalie, candidate.reviewSven].filter(Boolean).length;

                return (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        {candidate.blacklistMatch && (
                          <span className="text-red-600" title="Zwarte lijst overeenkomst">&#9873;</span>
                        )}
                        <span className="font-medium text-gray-800">
                          {candidate.firstName} {candidate.lastName}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">{candidate.email}</div>
                    </td>
                    <td className="px-3 py-3">
                      {candidate.animalName ? (
                        <span className="text-sm text-gray-700">{candidate.animalName}</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                      {candidate.species && (
                        <span className="ml-1 text-xs text-gray-400">
                          ({candidate.species === "hond" ? "H" : "K"})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {resultBadge ? (
                        <div>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${resultBadge.className}`}>
                            {resultBadge.label}
                          </span>
                          <span className="ml-1 text-xs text-gray-400">{reviewCount}/3</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">{reviewCount > 0 ? `${reviewCount}/3` : "-"}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      <div>{new Date(candidate.createdAt).toLocaleDateString("nl-BE", { day: "2-digit", month: "2-digit", year: "numeric" })}</div>
                      <div className="text-xs text-gray-400">{new Date(candidate.createdAt).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/beheerder/adoptie/${candidate.id}`}
                        className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
                      >
                        Bekijken
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
