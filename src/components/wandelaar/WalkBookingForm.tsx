"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { bookWalk } from "@/lib/actions/walks";
import type { Animal } from "@/types";

interface WalkBookingFormProps {
  dog: Animal;
  onCancel: () => void;
  onSuccess: () => void;
}

interface FieldErrors {
  date?: string;
  startTime?: string;
}

export default function WalkBookingForm({ dog, onCancel, onSuccess }: WalkBookingFormProps) {
  const [state, formAction, isPending] = useActionState(bookWalk, null);
  const hasHandledSuccess = useRef(false);

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (state?.success && !hasHandledSuccess.current) {
      hasHandledSuccess.current = true;
      const timer = setTimeout(onSuccess, 1500);
      return () => clearTimeout(timer);
    }
  }, [state, onSuccess]);

  function clearError(field: keyof FieldErrors) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!date.trim()) {
      errors.date = "Datum is verplicht.";
    }
    if (!startTime.trim()) {
      errors.startTime = "Starttijd is verplicht.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!validate()) {
      e.preventDefault();
      return;
    }
    // Let the form submit via the server action
  }

  const dateError = fieldErrors.date || (state && !state.success && state.fieldErrors?.date?.[0]);
  const startTimeError = fieldErrors.startTime || (state && !state.success && state.fieldErrors?.startTime?.[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="font-heading text-lg font-bold text-[#1b4332]">
          Wandeling boeken met {dog.name}
        </h2>

        {state?.success ? (
          <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
            {state.message}
          </div>
        ) : (
          <form action={formAction} onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
            <input type="hidden" name="animalId" value={dog.id} />

            {state && !state.success && state.error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {state.error}
              </div>
            )}

            <div>
              <label
                htmlFor="date"
                className={`block text-sm font-medium ${dateError ? "text-red-600" : "text-gray-700"}`}
              >
                Datum
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  clearError("date");
                }}
                min={new Date().toISOString().split("T")[0]}
                aria-invalid={!!dateError}
                aria-describedby={dateError ? "date-error" : undefined}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                  dateError ? "border-red-500" : "border-gray-300"
                }`}
              />
              {dateError && (
                <p id="date-error" role="alert" className="mt-1 text-sm text-red-600">
                  {dateError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="startTime"
                className={`block text-sm font-medium ${startTimeError ? "text-red-600" : "text-gray-700"}`}
              >
                Starttijd
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  clearError("startTime");
                }}
                aria-invalid={!!startTimeError}
                aria-describedby={startTimeError ? "startTime-error" : undefined}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                  startTimeError ? "border-red-500" : "border-gray-300"
                }`}
              />
              {startTimeError && (
                <p id="startTime-error" role="alert" className="mt-1 text-sm text-red-600">
                  {startTimeError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                Opmerkingen (optioneel)
              </label>
              <textarea
                id="remarks"
                name="remarks"
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Bijv. rustige wandeling gewenst..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-lg bg-[#2d6a4f] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1b4332] disabled:opacity-50"
              >
                {isPending ? "Bezig..." : "Bevestig boeking"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={isPending}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Annuleren
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
