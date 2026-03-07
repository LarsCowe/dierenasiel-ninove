"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createKennismaking } from "@/lib/actions/kennismakingen";

interface Props {
  candidateId: number;
  candidateName: string;
  animalId: number | null;
}

export default function KennismakingForm({ candidateId, candidateName, animalId }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createKennismaking, null);

  useEffect(() => {
    if (state?.success) {
      router.push(`/beheerder/adoptie/${candidateId}`);
    }
  }, [state, router, candidateId]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData();
    formData.append("json", JSON.stringify({
      adoptionCandidateId: candidateId,
      animalId,
      scheduledAt: (form.elements.namedItem("scheduledAt") as HTMLInputElement).value,
      location: (form.elements.namedItem("location") as HTMLInputElement).value || undefined,
    }));
    action(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {state && !state.success && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{state.error || "Er ging iets mis. Controleer de gegevens."}</p>
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Details</h2>
        <div className="mt-3 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500">Kandidaat</p>
            <p className="text-sm font-semibold text-gray-800">{candidateName}</p>
          </div>

          <div>
            <label htmlFor="scheduledAt" className="block text-xs font-medium text-gray-500">
              Datum en tijd *
            </label>
            <input
              type="datetime-local"
              id="scheduledAt"
              name="scheduledAt"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-xs font-medium text-gray-500">
              Locatie
            </label>
            <input
              type="text"
              id="location"
              name="location"
              placeholder="bv. Bezoekruimte A"
              maxLength={200}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#1b4332] px-5 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {pending ? "Plannen..." : "Kennismaking plannen"}
        </button>
      </div>
    </form>
  );
}
