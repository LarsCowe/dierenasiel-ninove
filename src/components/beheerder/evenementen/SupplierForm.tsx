"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupplier, updateSupplier, type SupplierRow } from "@/lib/actions/suppliers";

interface Props {
  supplier?: SupplierRow;
  onDone: () => void;
}

const INPUT =
  "mt-0.5 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-emerald-500 focus:ring-emerald-500";
const LABEL = "block text-xs font-medium text-gray-600";

type Veld = "name" | "phone" | "email" | "website" | "notes";

/** Story 13.16 — één leverancier toevoegen of bijwerken. */
export default function SupplierForm({ supplier, onDone }: Props) {
  const router = useRouter();
  const action = supplier ? updateSupplier : createSupplier;
  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onDone();
    }
  }, [state, router, onDone]);

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const globalError = state && !state.success ? state.error : undefined;
  // React 19 zet een formulier na een server action terug op zijn beginwaarden, ook bij
  // een fout. De action stuurt de ingevulde waarden terug; `key` laat ze opnieuw landen.
  const terug = state && !state.success ? state.values : undefined;
  const waarde = (veld: Veld) => terug?.[veld] ?? supplier?.[veld] ?? "";
  const sleutel = supplier?.id ?? "nieuw";

  function Fout({ veld }: { veld: Veld }) {
    const f = fieldErrors?.[veld];
    return f ? <p className="mt-1 text-sm text-red-600">{f[0]}</p> : null;
  }

  return (
    <form
      key={JSON.stringify(terug ?? {})}
      action={formAction}
      noValidate
      className="rounded-md border border-emerald-200 bg-emerald-50/50 p-3"
    >
      {supplier && <input type="hidden" name="id" value={supplier.id} />}
      {globalError && <p className="mb-2 text-sm text-red-600">{globalError}</p>}

      <div className="grid gap-2 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label htmlFor={`name-${sleutel}`} className={LABEL}>
            Naam <span className="text-red-500">*</span>
          </label>
          <input
            id={`name-${sleutel}`}
            name="name"
            defaultValue={waarde("name")}
            className={INPUT}
            placeholder="Bijv. Brouwerij De Ryck"
          />
          <Fout veld="name" />
        </div>

        <div className="sm:col-span-3">
          <label htmlFor={`phone-${sleutel}`} className={LABEL}>
            Gsm
          </label>
          <input
            id={`phone-${sleutel}`}
            name="phone"
            type="tel"
            defaultValue={waarde("phone")}
            className={INPUT}
            placeholder="Bijv. 0470 12 34 56"
          />
          <Fout veld="phone" />
        </div>

        <div className="sm:col-span-3">
          <label htmlFor={`email-${sleutel}`} className={LABEL}>
            E-mail
          </label>
          <input
            id={`email-${sleutel}`}
            name="email"
            type="email"
            defaultValue={waarde("email")}
            className={INPUT}
            placeholder="Bijv. info@deryck.be"
          />
          <Fout veld="email" />
        </div>

        <div className="sm:col-span-3">
          <label htmlFor={`website-${sleutel}`} className={LABEL}>
            Website
          </label>
          <input
            id={`website-${sleutel}`}
            name="website"
            defaultValue={waarde("website")}
            className={INPUT}
            placeholder="Bijv. deryck.be"
          />
          <Fout veld="website" />
        </div>

        <div className="sm:col-span-6">
          <label htmlFor={`notes-${sleutel}`} className={LABEL}>
            Notitie (optioneel)
          </label>
          <input
            id={`notes-${sleutel}`}
            name="notes"
            defaultValue={waarde("notes")}
            className={INPUT}
            placeholder="Bijv. contactpersoon Jan, levert enkel op vrijdag"
          />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-white"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-[#1b4332] px-4 py-1 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Opslaan..." : "Opslaan"}
        </button>
      </div>
    </form>
  );
}
