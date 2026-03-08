"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { markDogidCatidTransferred } from "@/lib/actions/adoption-contracts";
import type { AdoptionContract } from "@/types";

interface Props {
  contract: AdoptionContract;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  payconiq: "Payconiq",
  overschrijving: "Overschrijving",
};

export default function AdoptionContractInfo({ contract }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(markDogidCatidTransferred, null);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  const deadlineDate = contract.dogidCatidTransferDeadline
    ? new Date(contract.dogidCatidTransferDeadline)
    : null;
  const now = new Date();
  const daysLeft = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isUrgent = daysLeft !== null && daysLeft <= 3 && !contract.dogidCatidTransferred;

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${
      contract.dogidCatidTransferred
        ? "border-emerald-100 bg-emerald-50"
        : isUrgent
          ? "border-red-200 bg-red-50"
          : "border-purple-100 bg-purple-50"
    }`}>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Adoptiecontract</h2>
        <a
          href={`/api/adoptie-contract/${contract.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-[#1b4332] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2d6a4f] transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Contract afprinten
        </a>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-gray-500">Contractdatum</p>
          <p className="text-sm font-semibold text-gray-800">
            {new Date(contract.contractDate).toLocaleDateString("nl-BE")}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Betaling</p>
          <p className="text-sm font-semibold text-gray-800">
            {contract.paymentAmount} &euro; ({PAYMENT_LABELS[contract.paymentMethod] ?? contract.paymentMethod})
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">DogID/CatID overdracht deadline</p>
          <p className={`text-sm font-semibold ${isUrgent ? "text-red-700" : "text-gray-800"}`}>
            {deadlineDate?.toLocaleDateString("nl-BE") ?? "-"}
            {daysLeft !== null && !contract.dogidCatidTransferred && (
              <span className={`ml-2 text-xs ${isUrgent ? "text-red-600" : "text-gray-500"}`}>
                ({daysLeft > 0 ? `nog ${daysLeft} dag${daysLeft === 1 ? "" : "en"}` : "vervallen"})
              </span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">DogID/CatID overdracht</p>
          {contract.dogidCatidTransferred ? (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              Overgedragen
            </span>
          ) : (
            <form action={action}>
              <input type="hidden" name="contractId" value={contract.id} />
              <button
                type="submit"
                disabled={pending}
                onClick={(e) => {
                  if (!confirm("Bevestig: DogID/CatID overdracht is gemeld bij de bevoegde instantie?")) {
                    e.preventDefault();
                  }
                }}
                className="rounded-md bg-purple-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {pending ? "Registreren..." : "Overdracht registreren"}
              </button>
            </form>
          )}
        </div>
      </div>

      {state && !state.success && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{state.error}</p>
        </div>
      )}

      {contract.notes && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500">Notities</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{contract.notes}</p>
        </div>
      )}
    </div>
  );
}
