"use client";

import { useState, useTransition } from "react";
import { resetDatabase } from "@/lib/actions/database-reset";

export default function DatabaseResetPanel() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function handleReset() {
    if (
      !window.confirm(
        "OPGELET: Dit wist ALLE gegevens in de database (dieren, wandelaars, adopties, medische data, etc.). " +
          "Alleen standaardinstellingen en seed-gebruikers worden hersteld. " +
          "Deze actie is ONOMKEERBAAR. Weet je zeker dat je wilt doorgaan?",
      )
    )
      return;

    setMessage(null);
    setIsError(false);
    startTransition(async () => {
      const result = await resetDatabase();
      if (result.success) {
        setMessage(result.message ?? "Database is gewist.");
      } else {
        setIsError(true);
        setMessage(result.error ?? "Er ging iets mis.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-red-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-red-700">
        Database wissen
      </h3>
      <p className="mb-4 text-sm text-gray-500">
        Wis alle gegevens in de database. Standaardinstellingen en
        seed-gebruikers worden automatisch hersteld. Deze actie is
        onomkeerbaar.
      </p>

      <button
        type="button"
        onClick={handleReset}
        disabled={isPending}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {isPending ? "Bezig met wissen..." : "Database volledig wissen"}
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
