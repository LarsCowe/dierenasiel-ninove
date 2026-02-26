"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { createAnimalIntake } from "@/lib/actions/animals";

const SPECIES_OPTIONS = [
  { value: "hond", label: "Hond" },
  { value: "kat", label: "Kat" },
  { value: "ander", label: "Ander" },
];

const GENDER_OPTIONS: Record<string, { value: string; label: string }[]> = {
  hond: [
    { value: "reu", label: "Reu" },
    { value: "teef", label: "Teef" },
  ],
  kat: [
    { value: "kater", label: "Kater" },
    { value: "poes", label: "Poes" },
  ],
  ander: [
    { value: "mannetje", label: "Mannetje" },
    { value: "vrouwtje", label: "Vrouwtje" },
  ],
};

const INTAKE_REASONS = [
  { value: "", label: "Selecteer reden..." },
  { value: "afstand", label: "Afstand door eigenaar" },
  { value: "zwerfhond", label: "Zwerfdier (gevonden/gemeld)" },
  { value: "ibn", label: "Inbeslagname (IBN)" },
  { value: "vondeling", label: "Vondeling" },
  { value: "overig", label: "Overig" },
];

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

export default function IntakeForm() {
  const [state, formAction, isPending] = useActionState(createAnimalIntake, null);
  const [species, setSpecies] = useState("");
  const [isPickedUp, setIsPickedUp] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setSpecies("");
      setIsPickedUp(false);
    }
  }, [state]);

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const globalError = state && !state.success ? state.error : undefined;

  const today = new Date().toISOString().split("T")[0];

  return (
    <form ref={formRef} action={formAction} className="space-y-8">
      {/* Success message */}
      {state?.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">
            Dier succesvol geregistreerd!
          </p>
        </div>
      )}

      {/* Global error */}
      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{globalError}</p>
        </div>
      )}

      {/* Basic info */}
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
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Bijv. Rex"
            />
            <FieldError errors={fieldErrors?.name} />
          </div>

          {/* Soort */}
          <div>
            <label htmlFor="species" className="block text-sm font-medium text-gray-700">
              Soort <span className="text-red-500">*</span>
            </label>
            <select
              id="species"
              name="species"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
            >
              <option value="">Selecteer soort...</option>
              {SPECIES_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <FieldError errors={fieldErrors?.species} />
          </div>

          {/* Geslacht */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Geslacht <span className="text-red-500">*</span>
            </label>
            <select
              id="gender"
              name="gender"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              disabled={!species}
            >
              <option value="">Selecteer geslacht...</option>
              {species &&
                GENDER_OPTIONS[species]?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
            </select>
            <FieldError errors={fieldErrors?.gender} />
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
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Bijv. Mechelse Herder"
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
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Bijv. bruin"
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
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Identification */}
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
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Bijv. 981100004567890"
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
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Bijv. BE-123456"
            />
          </div>
        </div>
      </div>

      {/* Intake details */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-[#1b4332]">
          Intake
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Intake datum */}
          <div>
            <label htmlFor="intakeDate" className="block text-sm font-medium text-gray-700">
              Intake datum <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="intakeDate"
              name="intakeDate"
              defaultValue={today}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
            <FieldError errors={fieldErrors?.intakeDate} />
          </div>

          {/* Reden binnenkomst */}
          <div>
            <label htmlFor="intakeReason" className="block text-sm font-medium text-gray-700">
              Reden binnenkomst
            </label>
            <select
              id="intakeReason"
              name="intakeReason"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            >
              {INTAKE_REASONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Shelter pickup toggle */}
        <div className="mt-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isPickedUpByShelter"
              value="true"
              checked={isPickedUp}
              onChange={(e) => setIsPickedUp(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Opgehaald door het asiel (na melding)
            </span>
          </label>
        </div>

        {/* Melder details - shown when isPickedUp */}
        {isPickedUp && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-semibold text-amber-800">
              Melding details
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="intakeMetadata.melderNaam" className="block text-sm font-medium text-gray-700">
                  Naam melder
                </label>
                <input
                  type="text"
                  id="intakeMetadata.melderNaam"
                  name="intakeMetadata.melderNaam"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="Naam van de persoon die gemeld heeft"
                />
              </div>
              <div>
                <label htmlFor="intakeMetadata.melderDatum" className="block text-sm font-medium text-gray-700">
                  Datum melding
                </label>
                <input
                  type="date"
                  id="intakeMetadata.melderDatum"
                  name="intakeMetadata.melderDatum"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="intakeMetadata.melderLocatie" className="block text-sm font-medium text-gray-700">
                  Locatie ophaling
                </label>
                <input
                  type="text"
                  id="intakeMetadata.melderLocatie"
                  name="intakeMetadata.melderLocatie"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="Adres of locatie waar het dier is opgehaald"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
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
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Korte samenvatting (max 300 tekens)"
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
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Beschrijf het dier, karakter, bijzonderheden..."
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <a
          href="/beheerder"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Annuleren
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#1b4332] px-6 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Bezig met registreren..." : "Dier registreren"}
        </button>
      </div>
    </form>
  );
}
