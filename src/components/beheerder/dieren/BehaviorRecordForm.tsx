"use client";

import { useActionState, useState } from "react";
import { createBehaviorRecord, updateBehaviorRecord } from "@/lib/actions/behavior-records";
import { BEHAVIOR_VERZORGERS_ITEMS, BEHAVIOR_HONDEN_ITEMS } from "@/lib/constants";
import type { BehaviorRecord } from "@/types";

type JaNee = "ja" | "nee" | "";

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

  function boolToJaNee(val: unknown): JaNee {
    if (val === true) return "ja";
    if (val === false) return "nee";
    return "";
  }

  const [verzorgersValues, setVerzorgersValues] = useState<Record<string, JaNee>>(() => {
    const defaults: Record<string, JaNee> = {};
    for (const item of BEHAVIOR_VERZORGERS_ITEMS) {
      defaults[item.key] = boolToJaNee(existingChecklist?.[item.key]);
    }
    return defaults;
  });

  const [hondenValues, setHondenValues] = useState<Record<string, JaNee>>(() => {
    const defaults: Record<string, JaNee> = {};
    for (const item of BEHAVIOR_HONDEN_ITEMS) {
      defaults[item.key] = boolToJaNee(existingChecklist?.[item.key]);
    }
    return defaults;
  });

  const [verzorgersAndere, setVerzorgersAndere] = useState(
    () => (existingChecklist?.verzorgers_andere as string) ?? "",
  );
  const [hondenAndere, setHondenAndere] = useState(
    () => (existingChecklist?.honden_andere as string) ?? "",
  );

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const globalError = state && !state.success ? state.error : undefined;

  function jaNeeToBoolean(val: JaNee): boolean | null {
    if (val === "ja") return true;
    if (val === "nee") return false;
    return null;
  }

  function buildChecklist(): string {
    const checklist: Record<string, boolean | string | null> = {};
    for (const item of BEHAVIOR_VERZORGERS_ITEMS) {
      checklist[item.key] = jaNeeToBoolean(verzorgersValues[item.key]);
    }
    checklist.verzorgers_andere = verzorgersAndere.trim() || null;
    for (const item of BEHAVIOR_HONDEN_ITEMS) {
      checklist[item.key] = jaNeeToBoolean(hondenValues[item.key]);
    }
    checklist.honden_andere = hondenAndere.trim() || null;
    return JSON.stringify(checklist);
  }

  const radioClass = "h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500";
  const labelTextClass = "text-sm text-gray-700";

  function renderSection(
    title: string,
    items: readonly { key: string; label: string }[],
    values: Record<string, JaNee>,
    setValues: React.Dispatch<React.SetStateAction<Record<string, JaNee>>>,
    andereValue: string,
    setAndereValue: (v: string) => void,
  ) {
    return (
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[#1b4332] uppercase tracking-wide">
          {title}
        </h3>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-1/2"></th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 w-1/4">Ja</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 w-1/4">Nee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.key} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm text-gray-700">{item.label}</td>
                  <td className="px-4 py-2.5 text-center">
                    <input
                      type="radio"
                      name={item.key}
                      checked={values[item.key] === "ja"}
                      onChange={() => setValues((prev) => ({ ...prev, [item.key]: "ja" }))}
                      className={radioClass}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <input
                      type="radio"
                      name={item.key}
                      checked={values[item.key] === "nee"}
                      onChange={() => setValues((prev) => ({ ...prev, [item.key]: "nee" }))}
                      className={radioClass}
                    />
                  </td>
                </tr>
              ))}
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-sm text-gray-700">Andere:</td>
                <td colSpan={2} className="px-4 py-2.5">
                  <input
                    type="text"
                    value={andereValue}
                    onChange={(e) => setAndereValue(e.target.value)}
                    placeholder="Vrije opmerking..."
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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

      {/* Sectie 1: Gedrag tegenover de verzorgers */}
      {renderSection(
        "1. Gedrag tegenover de verzorgers",
        BEHAVIOR_VERZORGERS_ITEMS,
        verzorgersValues,
        setVerzorgersValues,
        verzorgersAndere,
        setVerzorgersAndere,
      )}

      {/* Sectie 2: Gedrag tegenover andere honden */}
      {renderSection(
        "2. Gedrag tegenover andere honden",
        BEHAVIOR_HONDEN_ITEMS,
        hondenValues,
        setHondenValues,
        hondenAndere,
        setHondenAndere,
      )}

      <FieldError errors={fieldErrors?.checklist} />

      {/* Notes */}
      <div>
        <label htmlFor="br-notes" className={`block text-sm font-medium ${labelTextClass}`}>
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
