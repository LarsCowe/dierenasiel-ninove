"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerOuttake } from "@/lib/actions/animals-status";
import { OUTTAKE_REASONS, type OuttakeReason } from "@/lib/validations/animals-status";

const REASON_LABELS: Record<OuttakeReason, string> = {
  adoptie: "Adoptie",
  terug_eigenaar: "Terug naar eigenaar",
  euthanasie: "Euthanasie",
};

interface OuttakeFormProps {
  animalId: number;
  animalName: string;
  isInShelter: boolean;
}

export default function OuttakeForm({
  animalId,
  animalName,
  isInShelter,
}: OuttakeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isInShelter) {
    return (
      <p className="text-sm text-gray-500 italic">
        Dit dier is niet meer in het asiel.
      </p>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError("Selecteer een reden voor uitstroom");
      return;
    }

    if (reason === "euthanasie") {
      if (!window.confirm(`Weet je zeker dat je euthanasie wilt registreren voor ${animalName}? Dit kan niet ongedaan worden.`)) {
        return;
      }
    }

    setError(null);
    startTransition(async () => {
      const result = await registerOuttake(animalId, reason, date);
      if (result.success) {
        setSuccess(true);
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "Er ging iets mis");
      }
    });
  }

  if (success) {
    return (
      <p className="text-sm text-emerald-600">
        Uitstroom geregistreerd voor {animalName}.
      </p>
    );
  }

  return (
    <div>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Uitstroom registreren
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-red-200 bg-red-50/50 p-4">
          <h4 className="text-sm font-bold text-red-800">
            Uitstroom registreren voor {animalName}
          </h4>

          <div className="space-y-1">
            <label htmlFor="outtake-reason" className="text-sm font-medium text-gray-700">
              Reden *
            </label>
            <select
              id="outtake-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              required
            >
              <option value="">— Selecteer reden —</option>
              {OUTTAKE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {REASON_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="outtake-date" className="text-sm font-medium text-gray-700">
              Datum *
            </label>
            <input
              id="outtake-date"
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              required
            />
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Bezig..." : "Bevestig uitstroom"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setError(null);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Annuleren
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
