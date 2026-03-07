"use client";

import { useActionState, useEffect, useRef } from "react";
import { createBlacklistEntry, updateBlacklistEntry } from "@/lib/actions/blacklist";
import type { BlacklistEntry } from "@/types";

interface Props {
  editEntry: BlacklistEntry | null;
  onClose: () => void;
}

export default function BlacklistForm({ editEntry, onClose }: Props) {
  const isEdit = !!editEntry;
  const [state, formAction, isPending] = useActionState(
    isEdit ? updateBlacklistEntry : createBlacklistEntry,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onClose();
    }
  }, [state, onClose]);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-[#1b4332]">
        {isEdit ? "Item bewerken" : "Toevoegen aan zwarte lijst"}
      </h2>

      <form ref={formRef} action={formAction} className="space-y-4">
        {isEdit && <input type="hidden" name="id" value={editEntry.id} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bl-firstName" className="mb-1 block text-sm font-medium text-gray-700">
              Voornaam *
            </label>
            <input
              id="bl-firstName"
              name="firstName"
              type="text"
              defaultValue={editEntry?.firstName ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {state && !state.success && state.fieldErrors?.firstName && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.firstName[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="bl-lastName" className="mb-1 block text-sm font-medium text-gray-700">
              Achternaam *
            </label>
            <input
              id="bl-lastName"
              name="lastName"
              type="text"
              defaultValue={editEntry?.lastName ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {state && !state.success && state.fieldErrors?.lastName && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.lastName[0]}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="bl-address" className="mb-1 block text-sm font-medium text-gray-700">
            Adres
          </label>
          <input
            id="bl-address"
            name="address"
            type="text"
            defaultValue={editEntry?.address ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="bl-reason" className="mb-1 block text-sm font-medium text-gray-700">
            Reden *
          </label>
          <textarea
            id="bl-reason"
            name="reason"
            rows={3}
            defaultValue={editEntry?.reason ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          {state && !state.success && state.fieldErrors?.reason && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.reason[0]}</p>
          )}
        </div>

        {state && !state.success && state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-[#1b4332] px-5 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
          >
            {isPending ? "Opslaan..." : isEdit ? "Bijwerken" : "Toevoegen"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuleren
          </button>
        </div>
      </form>
    </div>
  );
}
