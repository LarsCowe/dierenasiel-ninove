"use client";

import { useActionState } from "react";
import { updateAnimal } from "@/lib/actions/animals";
import type { Animal } from "@/types";
import Link from "next/link";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

export default function AnimalEditForm({ animal }: { animal: Animal }) {
  const [state, formAction, isPending] = useActionState(updateAnimal, null);

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const globalError = state && !state.success ? state.error : undefined;

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="id" value={animal.id} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
          {animal.name} bewerken
        </h1>
        <Link
          href="/beheerder/dieren"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Terug naar overzicht
        </Link>
      </div>

      {/* Success message */}
      {state?.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">
            Wijzigingen succesvol opgeslagen!
          </p>
        </div>
      )}

      {/* Global error */}
      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{globalError}</p>
        </div>
      )}

      {/* Basisgegevens */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-[#1b4332]">
          Basisgegevens
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Naam */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Naam <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={animal.name}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
            <FieldError errors={fieldErrors?.name} />
          </div>

          {/* Schuilnaam */}
          <div>
            <label htmlFor="aliasName" className="block text-sm font-medium text-gray-700">
              Schuilnaam
            </label>
            <input
              type="text"
              id="aliasName"
              name="aliasName"
              defaultValue={animal.aliasName ?? ""}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Alternatieve naam voor IBN-dieren"
            />
            <p className="mt-1 text-xs text-gray-500">
              Voor IBN-dieren die vrijkomen voor adoptie. Wordt op de website getoond i.p.v. de originele naam.
            </p>
          </div>

          {/* Ras */}
          <div>
            <label htmlFor="breed" className="block text-sm font-medium text-gray-700">
              Ras
            </label>
            <input
              type="text"
              id="breed"
              name="breed"
              defaultValue={animal.breed ?? ""}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Kleur */}
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700">
              Kleur
            </label>
            <input
              type="text"
              id="color"
              name="color"
              defaultValue={animal.color ?? ""}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Geboortedatum */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
              Geboortedatum
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              defaultValue={animal.dateOfBirth ?? ""}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Identificatie */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-[#1b4332]">
          Identificatie
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Chipnummer */}
          <div>
            <label htmlFor="identificationNr" className="block text-sm font-medium text-gray-700">
              Chipnummer
            </label>
            <input
              type="text"
              id="identificationNr"
              name="identificationNr"
              defaultValue={animal.identificationNr ?? ""}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Paspoortnummer */}
          <div>
            <label htmlFor="passportNr" className="block text-sm font-medium text-gray-700">
              Paspoortnummer
            </label>
            <input
              type="text"
              id="passportNr"
              name="passportNr"
              defaultValue={animal.passportNr ?? ""}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Barcode */}
          <div>
            <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">
              Barcode
            </label>
            <input
              type="text"
              id="barcode"
              name="barcode"
              defaultValue={animal.barcode ?? ""}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Beschrijving */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-[#1b4332]">
          Beschrijving
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700">
              Korte beschrijving
            </label>
            <input
              type="text"
              id="shortDescription"
              name="shortDescription"
              maxLength={300}
              defaultValue={animal.shortDescription ?? ""}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Uitgebreide beschrijving
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={animal.description ?? ""}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Website instellingen */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-[#1b4332]">
          Website
        </h2>

        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-3">
            <input type="hidden" name="isOnWebsite" value="false" />
            <input
              type="checkbox"
              name="isOnWebsite"
              value="true"
              defaultChecked={animal.isOnWebsite ?? false}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Zichtbaar op de website
            </span>
          </label>

          <label className="flex items-center gap-3">
            <input type="hidden" name="isFeatured" value="false" />
            <input
              type="checkbox"
              name="isFeatured"
              value="true"
              defaultChecked={animal.isFeatured ?? false}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-gray-700">
              In de kijker op homepage
            </span>
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <Link
          href="/beheerder/dieren"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Annuleren
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#1b4332] px-6 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Bezig met opslaan..." : "Wijzigingen opslaan"}
        </button>
      </div>
    </form>
  );
}
