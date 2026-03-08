"use client";

import { useActionState } from "react";
import { createVaccination } from "@/lib/actions/vaccinations";
import { VACCINATION_TYPES } from "@/lib/validations/vaccinations";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p role="alert" className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

interface VaccinationFormProps {
  animalId: number;
  onCancel?: () => void;
}

export default function VaccinationForm({ animalId, onCancel }: VaccinationFormProps) {
  const [state, formAction, isPending] = useActionState(createVaccination, null);
  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const globalError = state && !state.success ? state.error : undefined;

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state?.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-800">Vaccinatie geregistreerd!</p>
        </div>
      )}
      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-800">{globalError}</p>
        </div>
      )}

      <input type="hidden" name="animalId" value={animalId} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="vac-type" className={`block text-sm font-medium ${fieldErrors?.type ? "text-red-700" : "text-gray-700"}`}>
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="vac-type"
            name="type"
            required
            defaultValue=""
            aria-invalid={!!fieldErrors?.type}
            className={`mt-1 block w-full rounded-lg border ${fieldErrors?.type ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500`}
          >
            <option value="" disabled>Kies type...</option>
            {VACCINATION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <FieldError errors={fieldErrors?.type} />
        </div>

        <div>
          <label htmlFor="vac-date" className={`block text-sm font-medium ${fieldErrors?.date ? "text-red-700" : "text-gray-700"}`}>
            Datum <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="vac-date"
            name="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
            aria-invalid={!!fieldErrors?.date}
            className={`mt-1 block w-full rounded-lg border ${fieldErrors?.date ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500`}
          />
          <FieldError errors={fieldErrors?.date} />
        </div>

        <div>
          <label htmlFor="vac-nextDue" className={`block text-sm font-medium ${fieldErrors?.nextDueDate ? "text-red-700" : "text-gray-700"}`}>
            Volgende vervaldatum
          </label>
          <input
            type="date"
            id="vac-nextDue"
            name="nextDueDate"
            aria-invalid={!!fieldErrors?.nextDueDate}
            className={`mt-1 block w-full rounded-lg border ${fieldErrors?.nextDueDate ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500`}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="hidden" name="givenByShelter" value="false" />
        <input
          type="checkbox"
          id="vac-givenByShelter"
          name="givenByShelter"
          value="true"
          defaultChecked={true}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <label htmlFor="vac-givenByShelter" className="text-sm text-gray-700">
          Gezet door dierenasiel
        </label>
      </div>

      <div>
        <label htmlFor="vac-notes" className={`block text-sm font-medium ${fieldErrors?.notes ? "text-red-700" : "text-gray-700"}`}>
          Opmerkingen
        </label>
        <textarea
          id="vac-notes"
          name="notes"
          rows={2}
          aria-invalid={!!fieldErrors?.notes}
          className={`mt-1 block w-full rounded-lg border ${fieldErrors?.notes ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500`}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#1b4332] px-6 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Bezig met opslaan..." : "Vaccinatie registreren"}
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
