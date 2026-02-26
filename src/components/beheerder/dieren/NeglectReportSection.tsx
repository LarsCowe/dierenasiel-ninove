"use client";

import { useState } from "react";
import NeglectReportForm from "./NeglectReportForm";
import NeglectReportView from "./NeglectReportView";
import type { NeglectReport } from "@/types";

interface NeglectReportSectionProps {
  animalId: number;
  report: NeglectReport | null;
}

export default function NeglectReportSection({ animalId, report }: NeglectReportSectionProps) {
  const [editing, setEditing] = useState(false);

  if (!report) {
    return (
      <div className="mt-6 border-t border-red-200 pt-6">
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">
            Verwaarlozing-rapport ontbreekt — wettelijk verplicht bij IBN
          </p>
        </div>
        <h3 className="text-sm font-bold text-red-800">Verwaarlozing-rapport invullen</h3>
        <div className="mt-3">
          <NeglectReportForm animalId={animalId} />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-red-200 pt-6">
      <h3 className="text-sm font-bold text-red-800">Verwaarlozing-rapport</h3>
      <div className="mt-3">
        {editing ? (
          <NeglectReportForm
            animalId={animalId}
            existingReport={report}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <NeglectReportView
            report={report}
            onEdit={() => setEditing(true)}
          />
        )}
      </div>
    </div>
  );
}
