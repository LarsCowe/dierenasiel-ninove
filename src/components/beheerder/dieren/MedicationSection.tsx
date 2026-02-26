"use client";

import { useState } from "react";
import MedicationList from "./MedicationList";
import MedicationForm from "./MedicationForm";
import type { Medication, MedicationLog } from "@/types";

interface MedicationSectionProps {
  animalId: number;
  medications: Medication[];
  todayLogs: MedicationLog[];
}

export default function MedicationSection({ animalId, medications, todayLogs }: MedicationSectionProps) {
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
          Overzicht ({medications.length})
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
          Nieuw voorschrift
        </button>
      </div>

      {view === "list" ? (
        <MedicationList medications={medications} todayLogs={todayLogs} />
      ) : (
        <MedicationForm animalId={animalId} onCancel={() => setView("list")} />
      )}
    </div>
  );
}
