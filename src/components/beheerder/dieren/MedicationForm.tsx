"use client";

import { useActionState } from "react";
import { createMedication } from "@/lib/actions/medications";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p role="alert" className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

interface MedicationFormProps {
  animalId: number;
  onCancel?: () => void;
}

export default function MedicationForm({ animalId, onCancel }: MedicationFormProps) {
  const [state, formAction, isPending] = useActionState(createMedication, null);
  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const globalError = state && !state.success ? state.error : undefined;

  return (
    <form action={formAction} className="space-y-3">
      {state?.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
          <p className="text-sm font-medium text-emerald-800">Medicatie voorgeschreven!</p>
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
          <label htmlFor="med-name" className="block text-xs font-medium text-gray-600">
            Medicatienaam <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="med-name"
            name="medicationName"
            required
            maxLength={200}
            placeholder="bv. Amoxicilline"
            className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
          <FieldError errors={fieldErrors?.medicationName} />
        </div>

        <div>
          <label htmlFor="med-dosage" className="block text-xs font-medium text-gray-600">
            Dosering <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="med-dosage"
            name="dosage"
            required
            maxLength={100}
            placeholder="bv. 2x daags 1 tablet"
            className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
          <FieldError errors={fieldErrors?.dosage} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="med-start-date" className="block text-xs font-medium text-gray-600">
            Startdatum <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="med-start-date"
            name="startDate"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
            className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
          <FieldError errors={fieldErrors?.startDate} />
        </div>

        <div>
          <label htmlFor="med-end-date" className="block text-xs font-medium text-gray-600">
            Einddatum
          </label>
          <input
            type="date"
            id="med-end-date"
            name="endDate"
            className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
          <FieldError errors={fieldErrors?.endDate} />
        </div>
      </div>

      <div>
        <label htmlFor="med-quantity" className="block text-xs font-medium text-gray-600">
          Hoeveelheid
        </label>
        <input
          type="text"
          id="med-quantity"
          name="quantity"
          maxLength={100}
          placeholder="bv. 30 tabletten"
          className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
        <FieldError errors={fieldErrors?.quantity} />
      </div>

      <div>
        <label htmlFor="med-notes" className="block text-xs font-medium text-gray-600">
          Opmerkingen
        </label>
        <textarea
          id="med-notes"
          name="notes"
          rows={2}
          className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
        <FieldError errors={fieldErrors?.notes} />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-[#1b4332] px-5 py-1.5 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Opslaan..." : "Medicatie voorschrijven"}
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
