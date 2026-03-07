"use client";

import { useState } from "react";
import Link from "next/link";
import { KENNEL_POSITIONS } from "@/lib/constants/kennel-positions";
import type { Kennel, Animal } from "@/types";
import type { KennelWithOccupancy } from "@/lib/queries/kennels";

interface KennelFloorPlanProps {
  occupancy: KennelWithOccupancy[];
  animalsByKennel: Record<number, Animal[]>;
}

function getOccupancyColor(count: number, capacity: number): string {
  if (count === 0) return "bg-emerald-400/60 border-emerald-600 hover:bg-emerald-400/80";
  if (count < capacity) return "bg-amber-400/60 border-amber-600 hover:bg-amber-400/80";
  return "bg-red-400/60 border-red-600 hover:bg-red-400/80";
}

function getZoneLabel(zone: string): string {
  switch (zone) {
    case "honden": return "Honden";
    case "katten": return "Katten";
    case "andere": return "Andere";
    default: return zone;
  }
}

export default function KennelFloorPlan({
  occupancy,
  animalsByKennel,
}: KennelFloorPlanProps) {
  const [selectedKennel, setSelectedKennel] = useState<Kennel | null>(null);
  const [selectedAnimals, setSelectedAnimals] = useState<Animal[]>([]);

  // Map kennel code to occupancy data
  const occupancyMap = new Map(
    occupancy.map((o) => [o.kennel.code, o]),
  );

  function handleKennelClick(code: string) {
    const data = occupancyMap.get(code);
    if (!data) return;
    setSelectedKennel(data.kennel);
    setSelectedAnimals(animalsByKennel[data.kennel.id] ?? []);
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded border border-emerald-600 bg-emerald-400/60" />
          <span>Leeg</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded border border-amber-600 bg-amber-400/60" />
          <span>Deels bezet</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded border border-red-600 bg-red-400/60" />
          <span>Vol</span>
        </div>
      </div>

      {/* Floor plan + detail panel side by side on desktop */}
      <div className="flex flex-col gap-6 lg:flex-row">

      {/* Floor plan with overlay */}
      <div className="relative mx-auto w-full max-w-2xl lg:flex-1">
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/grondplan-kennels.png"
          alt="Grondplan kennels"
          className="w-full rounded-xl border border-gray-200 shadow-sm"
          draggable={false}
        />

        {/* Kennel overlays */}
        {KENNEL_POSITIONS.map((pos) => {
          const data = occupancyMap.get(pos.code);
          const count = data?.count ?? 0;
          const capacity = data?.kennel.capacity ?? 2;
          const colorClasses = getOccupancyColor(count, capacity);

          return (
            <button
              key={pos.code}
              type="button"
              onClick={() => handleKennelClick(pos.code)}
              aria-label={`Kennel ${pos.code}: ${count} van ${capacity} bezet`}
              className={`absolute flex flex-col items-center justify-center rounded border-2 text-xs font-bold transition-all ${colorClasses} ${
                selectedKennel?.code === pos.code ? "ring-2 ring-blue-500 ring-offset-1" : ""
              }`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${pos.w}%`,
                height: `${pos.h}%`,
              }}
              title={`${pos.code} — ${count}/${capacity}`}
            >
              <span className="text-[10px] leading-tight text-gray-900 drop-shadow-sm sm:text-xs">
                {pos.code}
              </span>
              <span className="text-[9px] leading-tight text-gray-700 sm:text-[10px]">
                {count}/{capacity}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail panel (beside on desktop, below on mobile) */}
      {selectedKennel && (
        <div className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:w-80 lg:flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold text-[#1b4332]">
              Kennel {selectedKennel.code}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({getZoneLabel(selectedKennel.zone)})
              </span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setSelectedKennel(null);
                setSelectedAnimals([]);
              }}
              aria-label="Detail paneel sluiten"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sluiten
            </button>
          </div>

          <p className="mt-1 text-sm text-gray-600">
            Bezetting: {selectedAnimals.length} / {selectedKennel.capacity}
            {selectedKennel.notes && (
              <span className="ml-2 italic text-gray-400">— {selectedKennel.notes}</span>
            )}
          </p>

          {selectedAnimals.length > 0 ? (
            <ul className="mt-3 divide-y divide-gray-100">
              {selectedAnimals.map((animal) => (
                <li key={animal.id} className="flex items-center gap-3 py-2">
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
                  <div>
                    <Link
                      href={`/beheerder/dieren/${animal.id}`}
                      className="text-sm font-medium text-[#1b4332] hover:underline"
                    >
                      {animal.name}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {animal.breed || animal.species} — {animal.gender}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-400">Deze kennel is leeg.</p>
          )}
        </div>
      )}

      </div>{/* end flex row */}
    </div>
  );
}
