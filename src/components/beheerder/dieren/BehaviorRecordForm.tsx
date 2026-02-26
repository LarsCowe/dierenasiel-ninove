"use client";

import { useActionState, useState } from "react";
import { createBehaviorRecord, updateBehaviorRecord } from "@/lib/actions/behavior-records";
import type { BehaviorRecord } from "@/types";

const SCORE_LABELS: Record<number, string> = {
  1: "Zeer goed",
  2: "Goed",
  3: "Neutraal",
  4: "Matig",
  5: "Problematisch",
};

const SCORE_CATEGORIES = [
  { key: "benaderingHok", label: "Reactie bij nadering hok" },
  { key: "uitHetHok", label: "Gedrag bij uit hok halen" },
  { key: "wandelingLeiband", label: "Wandeling aan de leiband" },
  { key: "reactieAndereHonden", label: "Reactie op andere honden" },
  { key: "reactieMensen", label: "Reactie op mensen/kinderen" },
  { key: "aanrakingManipulatie", label: "Aanraking/manipulatie" },
  { key: "voedselgedrag", label: "Voedselgedrag/resource guarding" },
] as const;

const AANDACHTSPUNTEN_OPTIONS = [
  { value: "angst", label: "Angst" },
  { value: "agressie", label: "Agressie" },
  { value: "separatieangst", label: "Separatieangst" },
  { value: "voedselagressie", label: "Voedselagressie" },
  { value: "leiband_reactief", label: "Leiband-reactief" },
  { value: "niet_zindelijk", label: "Niet zindelijk" },
  { value: "overmatig_blaffen", label: "Overmatig blaffen" },
  { value: "anders", label: "Anders" },
];

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p role="alert" className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

interface BehaviorRecordFormProps {
  animalId: number;
  existingRecord?: BehaviorRecord | null;
  onCancel?: () => void;
}

export default function BehaviorRecordForm({
  animalId,
  existingRecord,
  onCancel,
}: BehaviorRecordFormProps) {
  const isEdit = !!existingRecord;
  const action = isEdit ? updateBehaviorRecord : createBehaviorRecord;
  const [state, formAction, isPending] = useActionState(action, null);

  const existingChecklist = existingRecord?.checklist as Record<string, unknown> | null;

  const [scores, setScores] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {};
    for (const cat of SCORE_CATEGORIES) {
      defaults[cat.key] = (existingChecklist?.[cat.key] as number) || 3;
    }
    return defaults;
  });

  const [zindelijk, setZindelijk] = useState<string>(() => {
    if (existingChecklist?.zindelijk === true) return "true";
    if (existingChecklist?.zindelijk === false) return "false";
    return "null";
  });

  const [aandachtspunten, setAandachtspunten] = useState<string[]>(
    () => (existingChecklist?.aandachtspunten as string[]) ?? [],
  );

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const globalError = state && !state.success ? state.error : undefined;

  function buildChecklist(): string {
    return JSON.stringify({
      ...scores,
      zindelijk: zindelijk === "null" ? null : zindelijk === "true",
      aandachtspunten,
    });
  }

  function toggleAandachtspunt(value: string) {
    setAandachtspunten((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">
            Gedragsfiche succesvol {isEdit ? "bijgewerkt" : "opgeslagen"}!
          </p>
        </div>
      )}

      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{globalError}</p>
        </div>
      )}

      <input type="hidden" name="animalId" value={animalId} />
      {isEdit && <input type="hidden" name="id" value={existingRecord!.id} />}
      <input type="hidden" name="checklist" value={buildChecklist()} />

      {/* Date */}
      <div>
        <label htmlFor="br-date" className="block text-sm font-medium text-gray-700">
          Datum evaluatie <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="br-date"
          name="date"
          required
          defaultValue={existingRecord?.date ?? new Date().toISOString().split("T")[0]}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
        <FieldError errors={fieldErrors?.date} />
      </div>

      {/* Score categories */}
      <div>
        <p className="mb-3 text-sm font-medium text-gray-700">
          Gedragsevaluatie <span className="text-red-500">*</span>
        </p>
        <div className="space-y-3">
          {SCORE_CATEGORIES.map((cat) => (
            <div key={cat.key} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
              <label
                htmlFor={`br-${cat.key}`}
                className="min-w-[200px] text-sm text-gray-700"
              >
                {cat.label}
              </label>
              <select
                id={`br-${cat.key}`}
                value={scores[cat.key]}
                onChange={(e) =>
                  setScores((prev) => ({ ...prev, [cat.key]: Number(e.target.value) }))
                }
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} — {SCORE_LABELS[n]}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <FieldError errors={fieldErrors?.checklist} />
      </div>

      {/* Zindelijk */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Zindelijk</p>
        <div className="flex gap-4">
          {[
            { value: "true", label: "Ja" },
            { value: "false", label: "Nee" },
            { value: "null", label: "Onbekend" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="zindelijkRadio"
                value={opt.value}
                checked={zindelijk === opt.value}
                onChange={() => setZindelijk(opt.value)}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Aandachtspunten */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Aandachtspunten</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AANDACHTSPUNTEN_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={aandachtspunten.includes(opt.value)}
                onChange={() => toggleAandachtspunt(opt.value)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="br-notes" className="block text-sm font-medium text-gray-700">
          Opmerkingen
        </label>
        <textarea
          id="br-notes"
          name="notes"
          rows={3}
          defaultValue={existingRecord?.notes ?? ""}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          placeholder="Vrije opmerkingen over het gedrag..."
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#1b4332] px-6 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending
            ? "Bezig met opslaan..."
            : isEdit
              ? "Fiche bijwerken"
              : "Fiche opslaan"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuleren
          </button>
        )}
      </div>
    </form>
  );
}
