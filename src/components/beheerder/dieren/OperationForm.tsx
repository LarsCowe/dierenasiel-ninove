"use client";

import { useActionState } from "react";
import { createOperation } from "@/lib/actions/operations";
import { OPERATION_TYPES, OPERATION_STATUSES } from "@/lib/validations/operations";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p role="alert" className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

const TYPE_LABELS: Record<string, string> = {
  steriliseren: "Steriliseren",
  castreren: "Castreren",
  tanden_opkuisen: "Tanden opkuisen",
  gezwel_weghalen: "Gezwel weghalen",
};

const STATUS_LABELS: Record<string, string> = {
  gepland: "Gepland",
  uitgevoerd: "Uitgevoerd",
  uitgesteld: "Uitgesteld",
  on_hold: "On hold",
};

interface OperationFormProps {
  animalId: number;
  onCancel?: () => void;
}

export default function OperationForm({ animalId, onCancel }: OperationFormProps) {
  const [state, formAction, isPending] = useActionState(createOperation, null);
  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const globalError = state && !state.success ? state.error : undefined;

  return (
    <form action={formAction} className="space-y-3">
      {state?.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
          <p className="text-sm font-medium text-emerald-800">Operatie geregistreerd!</p>
        </div>
      )}
      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2.5">
          <p className="text-sm font-medium text-red-800">{globalError}</p>
        </div>
      )}

      <input type="hidden" name="animalId" value={animalId} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="op-date" className="block text-xs font-medium text-gray-600">
            Datum <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="op-date"
            name="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
            className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
          <FieldError errors={fieldErrors?.date} />
        </div>

        <div>
          <label htmlFor="op-type" className="block text-xs font-medium text-gray-600">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="op-type"
            name="type"
            required
            defaultValue=""
            className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="" disabled>Kies type...</option>
            {OPERATION_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          <FieldError errors={fieldErrors?.type} />
        </div>

        <div>
          <label htmlFor="op-status" className="block text-xs font-medium text-gray-600">
            Status
          </label>
          <select
            id="op-status"
            name="status"
            defaultValue="gepland"
            className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            {OPERATION_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <FieldError errors={fieldErrors?.status} />
        </div>
      </div>

      <div>
        <label htmlFor="op-notes" className="block text-xs font-medium text-gray-600">
          Opmerkingen
        </label>
        <textarea
          id="op-notes"
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
          {isPending ? "Opslaan..." : "Operatie registreren"}
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
