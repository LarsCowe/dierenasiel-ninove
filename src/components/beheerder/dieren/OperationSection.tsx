"use client";

import { useState } from "react";
import OperationList from "./OperationList";
import OperationForm from "./OperationForm";
import type { Operation } from "@/types";

interface OperationSectionProps {
  animalId: number;
  operations: Operation[];
}

export default function OperationSection({ animalId, operations }: OperationSectionProps) {
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
          Overzicht ({operations.length})
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
          Nieuwe operatie
        </button>
      </div>

      {view === "list" ? (
        <OperationList operations={operations} />
      ) : (
        <OperationForm animalId={animalId} onCancel={() => setView("list")} />
      )}
    </div>
  );
}
