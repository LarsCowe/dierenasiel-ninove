"use client";

import { useActionState, useState } from "react";
import { upsertFeedingPlan } from "@/lib/actions/feeding-plans";
import type { FeedingPlan, FeedingQuestionnaire } from "@/types";

const DIEET_OPTIES = ["droogvoer", "natvoer", "gemengd", "rauw", "dieetvoer", "anders"];
const FREQUENTIE_OPTIES = ["1x/dag", "2x/dag", "3x/dag", "vrije toegang"];
const ALLERGIE_OPTIES = ["graan", "kip", "rund", "vis", "zuivel", "soja", "anders"];

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p role="alert" className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

interface FeedingPlanFormProps {
  animalId: number;
  existingPlan?: FeedingPlan | null;
  onCancel?: () => void;
}

export default function FeedingPlanForm({
  animalId,
  existingPlan,
  onCancel,
}: FeedingPlanFormProps) {
  const existing = existingPlan?.questionnaire as FeedingQuestionnaire | undefined;

  const [state, formAction, isPending] = useActionState(upsertFeedingPlan, null);

  const [dieetType, setDieetType] = useState(existing?.dieetType ?? "");
  const [merk, setMerk] = useState(existing?.merk ?? "");
  const [hoeveelheid, setHoeveelheid] = useState(existing?.hoeveelheid ?? "");
  const [frequentie, setFrequentie] = useState(existing?.frequentie ?? "");
  const [allergieen, setAllergieen] = useState<string[]>(existing?.allergieen ?? []);
  const [specifiekeBehoeften, setSpecifiekeBehoeften] = useState(existing?.specifiekeBehoeften ?? "");

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const globalError = state && !state.success ? state.error : undefined;

  function toggleAllergie(value: string) {
    setAllergieen((prev) =>
      prev.includes(value)
        ? prev.filter((a) => a !== value)
        : [...prev, value],
    );
  }

  const questionnaire: FeedingQuestionnaire = {
    dieetType,
    merk,
    hoeveelheid,
    frequentie,
    allergieen,
    specifiekeBehoeften,
  };

  return (
    <form action={formAction} noValidate className="space-y-6">
      {state?.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">
            Voedingsplan succesvol opgeslagen!
          </p>
        </div>
      )}

      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{globalError}</p>
        </div>
      )}

      <input type="hidden" name="animalId" value={animalId} />
      <input type="hidden" name="questionnaire" value={JSON.stringify(questionnaire)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fp-dieetType" className={`block text-sm font-medium ${fieldErrors?.["questionnaire.dieetType"] ? "text-red-700" : "text-gray-700"}`}>
            Dieet type <span className="text-red-500">*</span>
          </label>
          <select
            id="fp-dieetType"
            value={dieetType}
            onChange={(e) => setDieetType(e.target.value)}
            aria-invalid={!!fieldErrors?.["questionnaire.dieetType"] || undefined}
            className={`mt-1 block w-full rounded-lg border ${fieldErrors?.["questionnaire.dieetType"] ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500`}
          >
            <option value="">— Selecteer —</option>
            {DIEET_OPTIES.map((opt) => (
              <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
          <FieldError errors={fieldErrors?.["questionnaire.dieetType"]} />
        </div>

        <div>
          <label htmlFor="fp-merk" className="block text-sm font-medium text-gray-700">
            Merk voeding
          </label>
          <input
            type="text"
            id="fp-merk"
            value={merk}
            onChange={(e) => setMerk(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            placeholder="bv. Royal Canin, Hill's..."
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fp-hoeveelheid" className={`block text-sm font-medium ${fieldErrors?.["questionnaire.hoeveelheid"] ? "text-red-700" : "text-gray-700"}`}>
            Hoeveelheid <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="fp-hoeveelheid"
            value={hoeveelheid}
            onChange={(e) => setHoeveelheid(e.target.value)}
            aria-invalid={!!fieldErrors?.["questionnaire.hoeveelheid"] || undefined}
            className={`mt-1 block w-full rounded-lg border ${fieldErrors?.["questionnaire.hoeveelheid"] ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500`}
            placeholder="bv. 200g per maaltijd"
          />
          <FieldError errors={fieldErrors?.["questionnaire.hoeveelheid"]} />
        </div>

        <div>
          <label htmlFor="fp-frequentie" className={`block text-sm font-medium ${fieldErrors?.["questionnaire.frequentie"] ? "text-red-700" : "text-gray-700"}`}>
            Frequentie <span className="text-red-500">*</span>
          </label>
          <select
            id="fp-frequentie"
            value={frequentie}
            onChange={(e) => setFrequentie(e.target.value)}
            aria-invalid={!!fieldErrors?.["questionnaire.frequentie"] || undefined}
            className={`mt-1 block w-full rounded-lg border ${fieldErrors?.["questionnaire.frequentie"] ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500`}
          >
            <option value="">— Selecteer —</option>
            {FREQUENTIE_OPTIES.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <FieldError errors={fieldErrors?.["questionnaire.frequentie"]} />
        </div>
      </div>

      <div>
        <p className="block text-sm font-medium text-gray-700">Allergieën</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {ALLERGIE_OPTIES.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={allergieen.includes(opt)}
                onChange={() => toggleAllergie(opt)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="fp-specifiekeBehoeften" className="block text-sm font-medium text-gray-700">
          Specifieke behoeften
        </label>
        <textarea
          id="fp-specifiekeBehoeften"
          value={specifiekeBehoeften}
          onChange={(e) => setSpecifiekeBehoeften(e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          placeholder="bv. puppy, senior, nierproblemen..."
        />
      </div>

      <div>
        <label htmlFor="fp-notes" className="block text-sm font-medium text-gray-700">
          Opmerkingen
        </label>
        <textarea
          id="fp-notes"
          name="notes"
          rows={2}
          defaultValue={existingPlan?.notes ?? ""}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#1b4332] px-6 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending
            ? "Bezig met opslaan..."
            : existingPlan
              ? "Voedingsplan bijwerken"
              : "Voedingsplan opslaan"}
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
