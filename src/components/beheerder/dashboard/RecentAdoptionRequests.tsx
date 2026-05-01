import Link from "next/link";
import type { RecentAdoptionRequest } from "@/lib/queries/dashboard";

export const ADOPTION_REQUEST_RANGES = [
  { value: "24u", label: "24u", days: 1 },
  { value: "7d", label: "7d", days: 7 },
  { value: "14d", label: "14d", days: 14 },
  { value: "21d", label: "21d", days: 21 },
] as const;

export type AdoptionRequestRange = (typeof ADOPTION_REQUEST_RANGES)[number]["value"];

export const DEFAULT_ADOPTION_REQUEST_RANGE: AdoptionRequestRange = "7d";

interface Props {
  requests: RecentAdoptionRequest[];
  range: AdoptionRequestRange;
}

function speciesEmoji(species: string | null): string {
  if (species === "hond") return "🐕";
  if (species === "kat") return "🐈";
  return "🐾";
}

function rangeHref(value: AdoptionRequestRange): string {
  if (value === DEFAULT_ADOPTION_REQUEST_RANGE) return "/beheerder";
  return `/beheerder?aanvragen=${value}`;
}

export default function RecentAdoptionRequests({ requests, range }: Props) {
  const linked = requests.filter((r) => r.animalId !== null);
  const unlinked = requests.filter((r) => r.animalId === null);
  const ordered = [...linked, ...unlinked];

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📩</span>
          <h3 className="font-heading text-sm font-bold text-[#1b4332]">
            Recente adoptie aanvragen
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {ADOPTION_REQUEST_RANGES.map((opt, i) => {
            const active = opt.value === range;
            return (
              <span key={opt.value} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-gray-300">·</span>}
                {active ? (
                  <span className="font-medium text-[#1b4332]">{opt.label}</span>
                ) : (
                  <Link
                    href={rangeHref(opt.value)}
                    scroll={false}
                    className="text-gray-400 hover:text-[#1b4332] hover:underline"
                  >
                    {opt.label}
                  </Link>
                )}
              </span>
            );
          })}
        </div>
      </div>
      {ordered.length === 0 ? (
        <p className="mt-4 text-center text-sm text-gray-400">
          Geen recente aanvragen
        </p>
      ) : (
        <div className="mt-4 divide-y divide-gray-50">
          {ordered.map((r) => {
            const label = `${r.count} ${r.count === 1 ? "aanvraag" : "aanvragen"}`;
            const name = r.animalName?.trim() || "Onbekend dier";
            const isLinked = r.animalId !== null;

            const row = (
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{speciesEmoji(r.species)}</span>
                  <span
                    className={`text-sm font-medium ${
                      isLinked ? "text-gray-700" : "text-gray-400"
                    }`}
                  >
                    {name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            );

            if (isLinked) {
              return (
                <Link
                  key={`linked-${r.animalId}`}
                  href={`/beheerder/adoptie?animalId=${r.animalId}`}
                  className="block hover:bg-gray-50"
                >
                  {row}
                </Link>
              );
            }
            return (
              <div
                key={`unlinked-${name}`}
                title="Geen gekoppeld dier"
                className="opacity-80"
              >
                {row}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
