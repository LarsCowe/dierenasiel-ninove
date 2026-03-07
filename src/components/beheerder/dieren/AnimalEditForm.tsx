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
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={animal.id} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold text-[#1b4332]">
          {animal.name} bewerken
        </h1>
        <Link
          href="/beheerder/dieren"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Terug naar overzicht
        </Link>
      </div>

      {/* Success message */}
      {state?.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <p className="text-sm font-medium text-emerald-800">
            Wijzigingen succesvol opgeslagen!
          </p>
        </div>
      )}

      {/* Global error */}
      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-sm font-medium text-red-800">{globalError}</p>
        </div>
      )}

      {/* Basisgegevens + Identificatie */}
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-[#1b4332]">Basisgegevens</h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-gray-600">
              Naam <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={animal.name}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
            <FieldError errors={fieldErrors?.name} />
          </div>

          <div>
            <label htmlFor="aliasName" className="block text-xs font-medium text-gray-600">
              Schuilnaam
            </label>
            <input
              type="text"
              id="aliasName"
              name="aliasName"
              defaultValue={animal.aliasName ?? ""}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="IBN alias"
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-xs font-medium text-gray-600">
              Geslacht <span className="text-red-500">*</span>
            </label>
            <select
              id="gender"
              name="gender"
              defaultValue={animal.gender ?? ""}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            >
              <option value="">Selecteer...</option>
              <option value="mannelijk">&#9794; Mannelijk</option>
              <option value="vrouwelijk">&#9792; Vrouwelijk</option>
              <option value="onbekend">Onbekend</option>
            </select>
            <FieldError errors={fieldErrors?.gender} />
          </div>

          <div>
            <label htmlFor="breed" className="block text-xs font-medium text-gray-600">
              Ras
            </label>
            <input
              type="text"
              id="breed"
              name="breed"
              defaultValue={animal.breed ?? ""}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="color" className="block text-xs font-medium text-gray-600">
              Kleur
            </label>
            <input
              type="text"
              id="color"
              name="color"
              defaultValue={animal.color ?? ""}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-xs font-medium text-gray-600">
              Geboortedatum
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              defaultValue={animal.dateOfBirth ?? ""}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="intakeDate" className="block text-xs font-medium text-gray-600">
              Intakedatum
            </label>
            <input
              type="date"
              id="intakeDate"
              name="intakeDate"
              defaultValue={animal.intakeDate ?? ""}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
            <FieldError errors={fieldErrors?.intakeDate} />
          </div>

          <div>
            <label htmlFor="intakeReason" className="block text-xs font-medium text-gray-600">
              Reden intake
            </label>
            <select
              id="intakeReason"
              name="intakeReason"
              defaultValue={animal.intakeReason ?? ""}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            >
              <option value="">Niet opgegeven</option>
              <option value="afstand">Afstand</option>
              <option value="ibn">IBN (Inbeslagname)</option>
              <option value="vondeling">Vondeling</option>
              <option value="zwerfhond">Zwerfhond</option>
              <option value="overig">Overig</option>
            </select>
          </div>

          <div>
            <label htmlFor="dossierNr" className="block text-xs font-medium text-gray-600">
              Dossiernummer Shelter
            </label>
            <input
              type="text"
              id="dossierNr"
              name="dossierNr"
              defaultValue={animal.dossierNr ?? ""}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Cijfercode"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input type="hidden" name="isNeutered" value="false" />
          <input
            type="checkbox"
            id="isNeutered"
            name="isNeutered"
            value="true"
            defaultChecked={animal.isNeutered ?? false}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="isNeutered" className="text-sm text-gray-700">
            Gesteriliseerd / Gecastreerd
          </label>
        </div>

        <h2 className="mt-4 border-t border-gray-100 pt-3 text-sm font-bold text-[#1b4332]">Identificatie</h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="identificationNr" className="block text-xs font-medium text-gray-600">
              Chipnummer
            </label>
            <input
              type="text"
              id="identificationNr"
              name="identificationNr"
              defaultValue={animal.identificationNr ?? ""}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
            <div className="mt-1.5 flex items-center gap-2">
              <input type="hidden" name="isNewChip" value="false" />
              <input
                type="checkbox"
                id="isNewChip"
                name="isNewChip"
                value="true"
                defaultChecked={animal.isNewChip ?? false}
                className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="isNewChip" className="text-xs text-gray-600">Nieuwe chip</label>
            </div>
          </div>

          <div>
            <label htmlFor="passportNr" className="block text-xs font-medium text-gray-600">
              Paspoortnummer
            </label>
            <input
              type="text"
              id="passportNr"
              name="passportNr"
              defaultValue={animal.passportNr ?? ""}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
            <div className="mt-1.5 flex items-center gap-2">
              <input type="hidden" name="isNewPassport" value="false" />
              <input
                type="checkbox"
                id="isNewPassport"
                name="isNewPassport"
                value="true"
                defaultChecked={animal.isNewPassport ?? false}
                className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="isNewPassport" className="text-xs text-gray-600">Nieuw paspoort</label>
            </div>
          </div>
        </div>

        {/* Barcode — alleen voor honden */}
        {animal.species === "hond" && (
          <div className="mt-3">
            <label htmlFor="barcode" className="block text-xs font-medium text-gray-600">
              Barcode
            </label>
            <input
              type="text"
              id="barcode"
              name="barcode"
              defaultValue={animal.barcode ?? ""}
              readOnly
              className="mt-0.5 block w-full rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-600"
            />
            <p className="mt-0.5 text-xs text-gray-400">Automatisch gegenereerd bij intake</p>
          </div>
        )}
      </div>

      {/* Beschrijving + Website */}
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-[#1b4332]">Beschrijving &amp; Website</h2>

        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="shortDescription" className="block text-xs font-medium text-gray-600">
              Korte beschrijving
            </label>
            <input
              type="text"
              id="shortDescription"
              name="shortDescription"
              maxLength={300}
              defaultValue={animal.shortDescription ?? ""}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-medium text-gray-600">
              Uitgebreide beschrijving
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={animal.description ?? ""}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-6 border-t border-gray-100 pt-3">
            <label className="flex items-center gap-2">
              <input type="hidden" name="isOnWebsite" value="false" />
              <input
                type="checkbox"
                name="isOnWebsite"
                value="true"
                defaultChecked={animal.isOnWebsite ?? false}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Zichtbaar op website</span>
            </label>

            <label className="flex items-center gap-2">
              <input type="hidden" name="isFeatured" value="false" />
              <input
                type="checkbox"
                name="isFeatured"
                value="true"
                defaultChecked={animal.isFeatured ?? false}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">In de kijker</span>
            </label>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-2">
        <Link
          href="/beheerder/dieren"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Annuleren
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-[#1b4332] px-5 py-1.5 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Opslaan..." : "Opslaan"}
        </button>
      </div>
    </form>
  );
}
