"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createVetInspectionReport } from "@/lib/actions/vet-inspection-reports";
import AnimalSelector from "./AnimalSelector";
import type { Animal, TreatedAnimalEntry, EuthanizedAnimalEntry, AbnormalBehaviorEntry } from "@/types";

interface Props {
  shelterAnimals: Pick<Animal, "id" | "name" | "species" | "identificationNr">[];
  defaultVetName: string;
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p role="alert" className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

type WithKey<T> = T & { _key: number };
let nextKey = 0;

export default function InspectionReportForm({ shelterAnimals, defaultVetName }: Props) {
  const router = useRouter();
  const [treated, setTreated] = useState<WithKey<TreatedAnimalEntry>[]>([]);
  const [euthanized, setEuthanized] = useState<WithKey<EuthanizedAnimalEntry>[]>([]);
  const [abnormal, setAbnormal] = useState<WithKey<AbnormalBehaviorEntry>[]>([]);

  const submitAction = async (_prev: Awaited<ReturnType<typeof createVetInspectionReport>> | null, formData: FormData) => {
    const visitDate = formData.get("visitDate") as string;
    const vetName = formData.get("vetName") as string;
    const recommendations = (formData.get("recommendations") as string) || undefined;

    const stripKey = <T extends { _key: number }>(arr: T[]) => arr.map(({ _key, ...rest }) => rest);
    const payload = { visitDate, vetName, animalsTreated: stripKey(treated), animalsEuthanized: stripKey(euthanized), abnormalBehavior: stripKey(abnormal), recommendations };
    const fd = new FormData();
    fd.append("json", JSON.stringify(payload));

    const result = await createVetInspectionReport(null, fd);
    if (result.success) {
      router.push(`/beheerder/medisch/bezoekrapport/${result.data.id}`);
    }
    return result;
  };

  const [state, formAction, isPending] = useActionState(submitAction, null);
  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const globalError = state && !state.success ? state.error : undefined;

  const addTreated = (animal: { animalId: number; animalName: string; species: string; chipNr: string | null }) => {
    setTreated((prev) => [...prev, { ...animal, diagnosis: "", treatment: "", _key: nextKey++ }]);
  };

  const addEuthanized = (animal: { animalId: number; animalName: string; species: string; chipNr: string | null }) => {
    setEuthanized((prev) => [...prev, { ...animal, reason: "", _key: nextKey++ }]);
  };

  const addAbnormal = (animal: { animalId: number; animalName: string; species: string; chipNr: string | null }) => {
    setAbnormal((prev) => [...prev, { ...animal, description: "", _key: nextKey++ }]);
  };

  return (
    <form action={formAction} className="space-y-6">
      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-800">{globalError}</p>
        </div>
      )}

      {/* Basis info */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Basisinformatie</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="visitDate" className="block text-xs font-medium text-gray-600">
              Bezoekdatum <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="visitDate"
              name="visitDate"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
            <FieldError errors={fieldErrors?.visitDate} />
          </div>
          <div>
            <label htmlFor="vetName" className="block text-xs font-medium text-gray-600">
              Naam dierenarts <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="vetName"
              name="vetName"
              required
              defaultValue={defaultVetName}
              className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
            <FieldError errors={fieldErrors?.vetName} />
          </div>
        </div>
      </div>

      {/* Behandelde dieren */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Behandelde dieren</h2>
        <div className="mt-3">
          <AnimalSelector shelterAnimals={shelterAnimals} onSelect={addTreated} label="Dier toevoegen" />
        </div>
        {treated.length > 0 && (
          <div className="mt-3 space-y-3">
            {treated.map((entry, idx) => (
              <div key={entry._key} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">
                    {entry.animalName} <span className="text-xs text-gray-500">({entry.species})</span>
                    {entry.chipNr && <span className="ml-2 text-xs text-gray-400">{entry.chipNr}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTreated((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Verwijderen
                  </button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-gray-500">Diagnose</label>
                    <textarea
                      rows={2}
                      value={entry.diagnosis}
                      onChange={(e) => setTreated((prev) => prev.map((item, i) => i === idx ? { ...item, diagnosis: e.target.value } : item))}
                      className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Behandeling</label>
                    <textarea
                      rows={2}
                      value={entry.treatment}
                      onChange={(e) => setTreated((prev) => prev.map((item, i) => i === idx ? { ...item, treatment: e.target.value } : item))}
                      className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Geëuthanaseerde dieren */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Geëuthanaseerde dieren</h2>
        <div className="mt-3">
          <AnimalSelector shelterAnimals={shelterAnimals} onSelect={addEuthanized} label="Dier toevoegen" />
        </div>
        {euthanized.length > 0 && (
          <div className="mt-3 space-y-3">
            {euthanized.map((entry, idx) => (
              <div key={entry._key} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">
                    {entry.animalName} <span className="text-xs text-gray-500">({entry.species})</span>
                    {entry.chipNr && <span className="ml-2 text-xs text-gray-400">{entry.chipNr}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEuthanized((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Verwijderen
                  </button>
                </div>
                <div className="mt-2">
                  <label className="block text-xs text-gray-500">Reden</label>
                  <textarea
                    rows={2}
                    value={entry.reason}
                    onChange={(e) => setEuthanized((prev) => prev.map((item, i) => i === idx ? { ...item, reason: e.target.value } : item))}
                    className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Afwijkend gedrag */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Dieren met afwijkend gedrag</h2>
        <div className="mt-3">
          <AnimalSelector shelterAnimals={shelterAnimals} onSelect={addAbnormal} label="Dier toevoegen" />
        </div>
        {abnormal.length > 0 && (
          <div className="mt-3 space-y-3">
            {abnormal.map((entry, idx) => (
              <div key={entry._key} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">
                    {entry.animalName} <span className="text-xs text-gray-500">({entry.species})</span>
                    {entry.chipNr && <span className="ml-2 text-xs text-gray-400">{entry.chipNr}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAbnormal((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Verwijderen
                  </button>
                </div>
                <div className="mt-2">
                  <label className="block text-xs text-gray-500">Beschrijving</label>
                  <textarea
                    rows={2}
                    value={entry.description}
                    onChange={(e) => setAbnormal((prev) => prev.map((item, i) => i === idx ? { ...item, description: e.target.value } : item))}
                    className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aanbevelingen */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Aanbevelingen</h2>
        <div className="mt-3">
          <textarea
            name="recommendations"
            rows={4}
            placeholder="Algemene aanbevelingen voor het asiel..."
            className="block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
          <FieldError errors={fieldErrors?.recommendations} />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-[#1b4332] px-6 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Opslaan..." : "Rapport opslaan"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/beheerder/medisch/bezoekrapport")}
          className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}
