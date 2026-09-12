"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { emailOwnerReturnCopy } from "@/lib/actions/owner-return";

interface Props {
  animalId: number;
  formId: number;
  ownerEmail: string | null;
  hasSigned: boolean;
}

/** Story 10.64 — "Kopie mailen naar eigenaar", met het formulier als bijlage. */
export default function OwnerReturnEmailButton({ animalId, formId, ownerEmail, hasSigned }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null);

  if (!ownerEmail) {
    return (
      <p className="text-xs text-gray-500">
        Geen e-mailadres op het formulier — druk het af als bewijs voor de eigenaar.
      </p>
    );
  }

  function verstuur() {
    setMelding(null);
    startTransition(async () => {
      const result = await emailOwnerReturnCopy(animalId, formId);
      if (result.success) {
        setMelding({ ok: true, tekst: result.message ?? "Verstuurd." });
        router.refresh();
      } else {
        setMelding({ ok: false, tekst: result.error ?? "Er ging iets mis" });
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={verstuur}
        disabled={isPending}
        className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
      >
        {isPending ? "Bezig met versturen..." : `Kopie mailen naar ${ownerEmail}`}
      </button>
      <p className="text-[11px] text-gray-500">
        {hasSigned ? "De getekende versie gaat als bijlage mee." : "Het ingevulde formulier (nog niet getekend) gaat als bijlage mee."}
      </p>
      {melding && (
        <p role="alert" className={`text-xs ${melding.ok ? "text-emerald-700" : "text-red-600"}`}>
          {melding.tekst}
        </p>
      )}
    </div>
  );
}
