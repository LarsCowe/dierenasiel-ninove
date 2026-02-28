"use client";

import { useActionState, useEffect, useRef } from "react";
import { bookWalk } from "@/lib/actions/walks";
import type { Animal } from "@/types";

interface WalkBookingFormProps {
  dog: Animal;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function WalkBookingForm({ dog, onCancel, onSuccess }: WalkBookingFormProps) {
  const [state, formAction, isPending] = useActionState(bookWalk, null);
  const hasHandledSuccess = useRef(false);

  useEffect(() => {
    if (state?.success && !hasHandledSuccess.current) {
      hasHandledSuccess.current = true;
      const timer = setTimeout(onSuccess, 1500);
      return () => clearTimeout(timer);
    }
  }, [state, onSuccess]);

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
          <form action={formAction} className="mt-4 space-y-4">
            <input type="hidden" name="animalId" value={dog.id} />

            {state && !state.success && state.error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {state.error}
              </div>
            )}

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Datum
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                min={new Date().toISOString().split("T")[0]}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {state && !state.success && state.fieldErrors?.date && (
                <p className="mt-1 text-sm text-red-600">{state.fieldErrors.date[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                Starttijd
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {state && !state.success && state.fieldErrors?.startTime && (
                <p className="mt-1 text-sm text-red-600">{state.fieldErrors.startTime[0]}</p>
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
