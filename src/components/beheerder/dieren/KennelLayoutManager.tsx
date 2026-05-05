"use client";

import { useMemo, useState } from "react";
import KennelFloorPlan from "./KennelFloorPlan";
import KennelSidebarList from "./KennelSidebarList";
import KennelCreateForm from "./KennelCreateForm";
import KennelDetailPanel from "./KennelDetailPanel";
import type { Animal, Kennel } from "@/types";
import type { KennelWithOccupancy } from "@/lib/queries/kennels";

interface Props {
  kennels: Kennel[];
  occupancy: KennelWithOccupancy[];
  animalsByKennel: Record<number, Animal[]>;
  allAnimals: Animal[];
}

export default function KennelLayoutManager({
  kennels,
  occupancy,
  animalsByKennel,
  allAnimals,
}: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedKennel, setSelectedKennel] = useState<Kennel | null>(null);
  const [activeLayer, setActiveLayer] = useState<number>(1);

  // Story 10.19+: bepaal welke lagen daadwerkelijk in gebruik zijn (sorteer oplopend).
  const availableLayers = useMemo(() => {
    const set = new Set<number>();
    kennels.forEach((k) => set.add(k.layer ?? 1));
    if (set.size === 0) set.add(1);
    return Array.from(set).sort((a, b) => a - b);
  }, [kennels]);

  const filteredKennels = kennels.filter((k) => (k.layer ?? 1) === activeLayer);
  const filteredOccupancy = occupancy.filter((o) => (o.kennel.layer ?? 1) === activeLayer);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr_320px]">
      <div className="order-2 space-y-4 lg:order-1">
        <KennelCreateForm defaultLayer={activeLayer} />
        <KennelSidebarList
          kennels={filteredKennels}
          editingId={editingId}
          onEditingChange={setEditingId}
        />
      </div>
      <div className="order-1 lg:order-2">
        <KennelFloorPlan
          occupancy={filteredOccupancy}
          animalsByKennel={animalsByKennel}
          editingKennelId={editingId}
          selectedKennelId={selectedKennel?.id ?? null}
          onSelectKennel={setSelectedKennel}
          activeLayer={activeLayer}
          availableLayers={availableLayers}
          onLayerChange={(l) => {
            setActiveLayer(l);
            setSelectedKennel(null);
            setEditingId(null);
          }}
        />
      </div>
      <div className="order-3 space-y-4">
        {selectedKennel && (
          <KennelDetailPanel
            kennel={selectedKennel}
            animals={animalsByKennel[selectedKennel.id] ?? []}
            allAnimals={allAnimals}
            onClose={() => setSelectedKennel(null)}
          />
        )}
      </div>
    </div>
  );
}
