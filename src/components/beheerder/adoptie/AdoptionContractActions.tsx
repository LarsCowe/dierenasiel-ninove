"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateContractStatusAction,
  cancelContractAction,
} from "@/lib/actions/adoption-contracts";

interface Props {
  contractId: number;
  status: string;
  candidateEmail: string;
  animalName?: string;
  pdfUrl?: string;
}

export default function AdoptionContractActions({
  contractId,
  status,
  candidateEmail,
  pdfUrl,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function markReady() {
    setError(null);
    startTransition(async () => {
      const result = await updateContractStatusAction(contractId, "klaar_voor_handtekening");
      if (!result.success) setError(result.error || "Mislukt");
      else router.refresh();
    });
  }

  function digitalSign() {
    alert("Nog te implementeren");
  }

  function cancelContract() {
    if (!confirm("Dit contract annuleren?")) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelContractAction(contractId);
      if (!result.success) setError(result.error || "Annuleren mislukt");
      else router.refresh();
    });
  }

  const canSign = status === "draft" || status === "klaar_voor_handtekening" || status === "verzonden_voor_digitale_handtekening";
  const canMarkReady = status === "draft";
  const canCancel = status !== "getekend" && status !== "geannuleerd";

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-[#1b4332] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#2d6a4f]"
          >
            Contract PDF openen
          </a>
        )}
        {canMarkReady && (
          <button
            type="button"
            onClick={markReady}
            disabled={isPending}
            className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-100 disabled:opacity-50"
          >
            Markeer klaar voor handtekening
          </button>
        )}
        {canSign && (
          <button
            type="button"
            onClick={digitalSign}
            disabled={isPending || !candidateEmail}
            title={!candidateEmail ? "Geen email beschikbaar voor adoptant" : undefined}
            className="rounded-md border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
          >
            Digitaal laten ondertekenen
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={cancelContract}
            disabled={isPending}
            className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            Contract annuleren
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
