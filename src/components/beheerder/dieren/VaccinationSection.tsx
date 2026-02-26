"use client";

import { useState } from "react";
import VaccinationList from "./VaccinationList";
import VaccinationForm from "./VaccinationForm";
import type { Vaccination } from "@/types";

interface VaccinationSectionProps {
  animalId: number;
  vaccinations: Vaccination[];
}

export default function VaccinationSection({ animalId, vaccinations }: VaccinationSectionProps) {
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
          Overzicht ({vaccinations.length})
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
          Nieuwe vaccinatie
        </button>
      </div>

      {view === "list" ? (
        <VaccinationList vaccinations={vaccinations} />
      ) : (
        <VaccinationForm animalId={animalId} onCancel={() => setView("list")} />
      )}
    </div>
  );
}
