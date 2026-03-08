"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createAdoptionContract } from "@/lib/actions/adoption-contracts";

interface Props {
  candidateId: number;
  candidateName: string;
  animalId: number;
  animalName: string;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "payconiq", label: "Payconiq" },
  { value: "overschrijving", label: "Overschrijving" },
];

export default function AdoptionContractForm({ candidateId, candidateName, animalId, animalName }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createAdoptionContract, null);

  useEffect(() => {
    if (state?.success) {
      if (state.message) {
        alert(state.message);
      }
      router.push(`/beheerder/adoptie/${candidateId}`);
    }
  }, [state, router, candidateId]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData();
    fd.append("json", JSON.stringify({
      animalId,
      candidateId,
      contractDate: (form.elements.namedItem("contractDate") as HTMLInputElement).value,
      paymentAmount: (form.elements.namedItem("paymentAmount") as HTMLInputElement).value,
      paymentMethod: (form.elements.namedItem("paymentMethod") as HTMLSelectElement).value,
      notes: (form.elements.namedItem("notes") as HTMLTextAreaElement).value || undefined,
    }));
    action(fd);
  }

  const fieldErrors = state && !state.success ? (state as { fieldErrors?: Record<string, string[]> }).fieldErrors : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {state && !state.success && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{state.error}</p>
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Contractgegevens</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-gray-500">Adoptant</p>
            <p className="text-sm font-semibold text-gray-800">{candidateName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Dier</p>
            <p className="text-sm font-semibold text-gray-800">{animalName} (ID: {animalId})</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Details</h2>
        <div className="mt-3 space-y-4">
          <div>
            <label htmlFor="contractDate" className={`block text-xs font-medium ${fieldErrors?.contractDate ? "text-red-700" : "text-gray-500"}`}>
              Contractdatum *
            </label>
            <input
              type="date"
              id="contractDate"
              name="contractDate"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              aria-invalid={!!fieldErrors?.contractDate}
              className={`mt-1 block w-full rounded-md border ${fieldErrors?.contractDate ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="paymentAmount" className={`block text-xs font-medium ${fieldErrors?.paymentAmount ? "text-red-700" : "text-gray-500"}`}>
                Bedrag (EUR) *
              </label>
              <input
                type="text"
                id="paymentAmount"
                name="paymentAmount"
                required
                placeholder="bv. 150.00"
                aria-invalid={!!fieldErrors?.paymentAmount}
                className={`mt-1 block w-full rounded-md border ${fieldErrors?.paymentAmount ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500`}
              />
            </div>

            <div>
              <label htmlFor="paymentMethod" className={`block text-xs font-medium ${fieldErrors?.paymentMethod ? "text-red-700" : "text-gray-500"}`}>
                Betaalwijze *
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                required
                aria-invalid={!!fieldErrors?.paymentMethod}
                className={`mt-1 block w-full rounded-md border ${fieldErrors?.paymentMethod ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500`}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-xs font-medium text-gray-500">
              Opmerkingen
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
        <p className="text-sm text-amber-800">
          Let op: na opslaan wordt het dier automatisch als &quot;geadopteerd&quot; gemarkeerd en de kandidaat-status bijgewerkt naar &quot;adopted&quot;.
        </p>
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
          {pending ? "Opslaan..." : "Contract opmaken"}
        </button>
      </div>
    </form>
  );
}
