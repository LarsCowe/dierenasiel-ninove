"use client";

import { useActionState } from "react";
import { createVetVisit } from "@/lib/actions/vet-visits";
import { VET_VISIT_LOCATIONS } from "@/lib/validations/vet-visits";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p role="alert" className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

const LOCATION_LABELS: Record<string, string> = {
  in_asiel: "In het asiel",
  in_praktijk: "In de praktijk",
};

interface VetVisitFormProps {
  animalId: number;
  onCancel?: () => void;
}

export default function VetVisitForm({ animalId, onCancel }: VetVisitFormProps) {
  const [state, formAction, isPending] = useActionState(createVetVisit, null);
  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const globalError = state && !state.success ? state.error : undefined;

  return (
    <form action={formAction} className="space-y-3">
      {state?.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
          <p className="text-sm font-medium text-emerald-800">Bezoek geregistreerd!</p>
        </div>
      )}
      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2.5">
          <p className="text-sm font-medium text-red-800">{globalError}</p>
        </div>
      )}

      <input type="hidden" name="animalId" value={animalId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="vv-date" className="block text-xs font-medium text-gray-600">
            Datum <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="vv-date"
            name="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
            className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
          <FieldError errors={fieldErrors?.date} />
        </div>

        <div>
          <label htmlFor="vv-location" className="block text-xs font-medium text-gray-600">
            Locatie <span className="text-red-500">*</span>
          </label>
          <select
            id="vv-location"
            name="location"
            required
            defaultValue=""
            className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="" disabled>Kies locatie...</option>
            {VET_VISIT_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{LOCATION_LABELS[loc]}</option>
            ))}
          </select>
          <FieldError errors={fieldErrors?.location} />
        </div>
      </div>

      <div>
        <label htmlFor="vv-complaints" className="block text-xs font-medium text-gray-600">
          Klachten / Bevindingen
        </label>
        <textarea
          id="vv-complaints"
          name="complaints"
          rows={2}
          className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
        <FieldError errors={fieldErrors?.complaints} />
      </div>

      <div>
        <label htmlFor="vv-todo" className="block text-xs font-medium text-gray-600">
          Vervolgstappen / Todo
        </label>
        <textarea
          id="vv-todo"
          name="todo"
          rows={2}
          className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
        <FieldError errors={fieldErrors?.todo} />
      </div>

      <div>
        <label htmlFor="vv-notes" className="block text-xs font-medium text-gray-600">
          Opmerkingen
        </label>
        <textarea
          id="vv-notes"
          name="notes"
          rows={2}
          className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-[#1b4332] px-5 py-1.5 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Opslaan..." : "Bezoek registreren"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuleren
          </button>
        )}
      </div>
    </form>
  );
}
