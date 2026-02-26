"use client";

import { useState } from "react";
import VetVisitList from "./VetVisitList";
import VetVisitForm from "./VetVisitForm";
import type { VetVisit } from "@/types";

interface VetVisitSectionProps {
  animalId: number;
  visits: VetVisit[];
}

export default function VetVisitSection({ animalId, visits }: VetVisitSectionProps) {
  const [view, setView] = useState<"list" | "form">("list");

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium ${
            view === "list"
              ? "bg-[#1b4332] text-white"
              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Overzicht ({visits.length})
        </button>
        <button
          type="button"
          onClick={() => setView("form")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium ${
            view === "form"
              ? "bg-[#1b4332] text-white"
              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Nieuw bezoek
        </button>
      </div>

      {view === "list" ? (
        <VetVisitList visits={visits} />
      ) : (
        <VetVisitForm animalId={animalId} onCancel={() => setView("list")} />
      )}
    </div>
  );
}
