"use client";

import Link from "next/link";
import { useActionState, useRef, useEffect } from "react";
import { createCampaignAction } from "@/lib/actions/stray-cat-campaigns";
import type { ActionResult, MunicipalityLogo } from "@/types";

async function handleCreate(_prev: ActionResult<{ id: number }> | null, formData: FormData) {
  return createCampaignAction({
    requestDate: formData.get("requestDate") as string,
    municipality: formData.get("municipality") as string,
    address: formData.get("address") as string,
    remarks: (formData.get("remarks") as string) || "",
  });
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p role="alert" className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

interface Props {
  opdrachtgevers: MunicipalityLogo[];
}

export default function CampaignCreateForm({ opdrachtgevers }: Props) {
  const [state, formAction, isPending] = useActionState(handleCreate, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          Campagne succesvol aangemaakt.
        </div>
      )}
      {state && !state.success && state.error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#1b4332]">Verzoekgegevens</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="requestDate" className="block text-sm font-medium text-gray-700">
              Datum verzoek *
            </label>
            <input
              type="date"
              id="requestDate"
              name="requestDate"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
            <FieldError errors={fieldErrors?.requestDate} />
          </div>

          <div>
            <label htmlFor="municipality" className="block text-sm font-medium text-gray-700">
              Gemeente / Opdrachtgever *
            </label>
            {opdrachtgevers.length === 0 ? (
              <div className="mt-1">
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Nog geen opdrachtgevers in de bibliotheek.{" "}
                  <Link
                    href="/beheerder/dieren/zwerfkattenbeleid/opdrachtgevers"
                    className="font-medium underline hover:text-amber-900"
                  >
                    Voeg er eerst één toe
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <select
                id="municipality"
                name="municipality"
                defaultValue=""
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="" disabled>— Kies een opdrachtgever —</option>
                {opdrachtgevers.map((o) => (
                  <option key={o.id} value={o.name}>{o.name}</option>
                ))}
              </select>
            )}
            <FieldError errors={fieldErrors?.municipality} />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Adres / locatie *
          </label>
          <textarea
            id="address"
            name="address"
            rows={2}
            placeholder="Straat en omschrijving locatie"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
          <FieldError errors={fieldErrors?.address} />
        </div>

        <div className="mt-4">
          <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
            Opmerkingen
          </label>
          <textarea
            id="remarks"
            name="remarks"
            rows={2}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#1b4332] px-6 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Bezig..." : "Campagne aanmaken"}
        </button>
      </div>
    </form>
  );
}
