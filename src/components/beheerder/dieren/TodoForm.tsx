"use client";

import { useActionState } from "react";
import { createAnimalTodo } from "@/lib/actions/animal-todos";
import { TODO_TYPES, TODO_TYPE_LABELS, TODO_PRIORITIES, TODO_PRIORITY_LABELS } from "@/lib/constants";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p role="alert" className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

interface TodoFormProps {
  animalId: number;
  onCancel?: () => void;
}

export default function TodoForm({ animalId, onCancel }: TodoFormProps) {
  const [state, formAction, isPending] = useActionState(createAnimalTodo, null);
  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const globalError = state && !state.success ? state.error : undefined;
  const formKey = state?.success ? Date.now() : 0;

  return (
    <form key={formKey} action={formAction} noValidate className="space-y-3">
      {state?.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
          <p className="text-sm font-medium text-emerald-800">Taak aangemaakt!</p>
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
          <label htmlFor="todo-type" className={`block text-xs font-medium ${fieldErrors?.type ? "text-red-700" : "text-gray-600"}`}>
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="todo-type"
            name="type"
            required
            aria-invalid={!!fieldErrors?.type}
            className={`mt-0.5 block w-full rounded-md border ${fieldErrors?.type ? "border-red-500" : "border-gray-300"} px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500`}
          >
            <option value="">Kies een type...</option>
            {TODO_TYPES.map((t) => (
              <option key={t} value={t}>{TODO_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <FieldError errors={fieldErrors?.type} />
        </div>

        <div>
          <label htmlFor="todo-priority" className={`block text-xs font-medium ${fieldErrors?.priority ? "text-red-700" : "text-gray-600"}`}>
            Prioriteit
          </label>
          <select
            id="todo-priority"
            name="priority"
            defaultValue="normaal"
            aria-invalid={!!fieldErrors?.priority}
            className={`mt-0.5 block w-full rounded-md border ${fieldErrors?.priority ? "border-red-500" : "border-gray-300"} px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500`}
          >
            {TODO_PRIORITIES.map((p) => (
              <option key={p} value={p}>{TODO_PRIORITY_LABELS[p]}</option>
            ))}
          </select>
          <FieldError errors={fieldErrors?.priority} />
        </div>
      </div>

      <div>
        <label htmlFor="todo-description" className={`block text-xs font-medium ${fieldErrors?.description ? "text-red-700" : "text-gray-600"}`}>
          Beschrijving <span className="text-red-500">*</span>
        </label>
        <textarea
          id="todo-description"
          name="description"
          required
          rows={3}
          maxLength={2000}
          placeholder="Wat moet er gebeuren?"
          aria-invalid={!!fieldErrors?.description}
          className={`mt-0.5 block w-full rounded-md border ${fieldErrors?.description ? "border-red-500" : "border-gray-300"} px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500`}
        />
        <FieldError errors={fieldErrors?.description} />
      </div>

      <div className="sm:w-1/2">
        <label htmlFor="todo-due-date" className={`block text-xs font-medium ${fieldErrors?.dueDate ? "text-red-700" : "text-gray-600"}`}>
          Deadline
        </label>
        <input
          type="date"
          id="todo-due-date"
          name="dueDate"
          aria-invalid={!!fieldErrors?.dueDate}
          className={`mt-0.5 block w-full rounded-md border ${fieldErrors?.dueDate ? "border-red-500" : "border-gray-300"} px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500`}
        />
        <FieldError errors={fieldErrors?.dueDate} />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-[#1b4332] px-5 py-1.5 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Opslaan..." : "Taak aanmaken"}
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
