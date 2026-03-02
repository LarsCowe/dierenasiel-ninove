"use client";

import { useState, useTransition } from "react";
import { seedDatabase } from "@/lib/actions/database-reset";

export default function SeedTestDataPanel() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function handleSeed() {
    if (
      !window.confirm(
        "Dit wist ALLE huidige gegevens en laadt de oorspronkelijke testdata opnieuw " +
          "(dieren, kennels, nieuwsartikelen, pagina's, sponsors, gebruikers en instellingen). " +
          "Weet je zeker dat je wilt doorgaan?",
      )
    )
      return;

    setMessage(null);
    setIsError(false);
    startTransition(async () => {
      const result = await seedDatabase();
      if (result.success) {
        setMessage(result.message ?? "Testdata is geladen.");
      } else {
        setIsError(true);
        setMessage(result.error ?? "Er ging iets mis.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-amber-700">
        Seed testdata
      </h3>
      <p className="mb-4 text-sm text-gray-500">
        Wis alle gegevens en laad de oorspronkelijke testdata opnieuw in
        (kennels, dieren, nieuwsartikelen, pagina&apos;s, sponsors, gebruikers
        en instellingen).
      </p>

      <button
        type="button"
        onClick={handleSeed}
        disabled={isPending}
        className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {isPending ? "Bezig met laden..." : "Testdata laden"}
      </button>

      {message && (
        <p
          className={`mt-2 text-sm ${isError ? "text-red-600" : "text-green-600"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
