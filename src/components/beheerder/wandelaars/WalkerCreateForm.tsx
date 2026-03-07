"use client";

import { useActionState, useEffect, useRef } from "react";
import { createWalkerManual } from "@/lib/actions/walkers";

interface Props {
  onClose: () => void;
}

export default function WalkerCreateForm({ onClose }: Props) {
  const [state, formAction, isPending] = useActionState(createWalkerManual, null);
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
        Nieuwe wandelaar toevoegen
      </h2>

      <form ref={formRef} action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="wc-firstName" className="mb-1 block text-sm font-medium text-gray-700">
              Voornaam *
            </label>
            <input
              id="wc-firstName"
              name="firstName"
              type="text"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="wc-lastName" className="mb-1 block text-sm font-medium text-gray-700">
              Achternaam *
            </label>
            <input
              id="wc-lastName"
              name="lastName"
              type="text"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="wc-email" className="mb-1 block text-sm font-medium text-gray-700">
              E-mail *
            </label>
            <input
              id="wc-email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="wc-phone" className="mb-1 block text-sm font-medium text-gray-700">
              Telefoon *
            </label>
            <input
              id="wc-phone"
              name="phone"
              type="tel"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="wc-dateOfBirth" className="mb-1 block text-sm font-medium text-gray-700">
              Geboortedatum *
            </label>
            <input
              id="wc-dateOfBirth"
              name="dateOfBirth"
              type="date"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="wc-address" className="mb-1 block text-sm font-medium text-gray-700">
              Adres *
            </label>
            <input
              id="wc-address"
              name="address"
              type="text"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="wc-autoApprove"
            name="autoApprove"
            value="true"
            defaultChecked
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="wc-autoApprove" className="text-sm text-gray-700">
            Direct goedkeuren (maakt automatisch een gebruikersaccount aan)
          </label>
        </div>

        {state && !state.success && state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        {state?.success && state.message && (
          <p className="text-sm text-emerald-600">{state.message}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-[#1b4332] px-5 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
          >
            {isPending ? "Aanmaken..." : "Wandelaar aanmaken"}
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
