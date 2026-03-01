"use client";

import { useState, useTransition, useEffect } from "react";
import {
  getCandidateDetailAction,
  getWalkerDetailAction,
  anonymizeCandidateAction,
  anonymizeWalkerAction,
} from "@/app/(beheerder)/beheerder/gdpr/actions";
import type { GdprSearchResult } from "@/types";
import { ANONYMIZED_VALUE } from "@/lib/constants";

interface Props {
  person: GdprSearchResult;
  onClose: () => void;
  onAnonymised: () => void;
}

export default function GdprPersonDetail({ person, onClose, onAnonymised }: Props) {
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    const loadDetail = async () => {
      const data =
        person.type === "candidate"
          ? await getCandidateDetailAction(person.id)
          : await getWalkerDetailAction(person.id);
      setDetail(data as Record<string, unknown> | null);
      setLoading(false);
    };
    loadDetail();
  }, [person.type, person.id]);

  function handleAnonymize() {
    if (
      !window.confirm(
        "Deze actie is onomkeerbaar. Alle persoonsgegevens worden permanent gewist.",
      )
    )
      return;

    startTransition(async () => {
      const result =
        person.type === "candidate"
          ? await anonymizeCandidateAction(person.id)
          : await anonymizeWalkerAction(person.id);

      if (result.success) {
        setMessage({ type: "success", text: result.message ?? "Persoonsgegevens geanonimiseerd." });
        setTimeout(() => onAnonymised(), 1500);
      } else {
        setMessage({ type: "error", text: result.error ?? "Er ging iets mis." });
      }
    });
  }

  const isAnonymised = person.anonymisedAt !== null;

  const piiFields =
    person.type === "candidate"
      ? [
          { label: "Voornaam", key: "firstName" },
          { label: "Achternaam", key: "lastName" },
          { label: "E-mail", key: "email" },
          { label: "Telefoon", key: "phone" },
          { label: "Adres", key: "address" },
          { label: "Opmerkingen", key: "notes" },
        ]
      : [
          { label: "Voornaam", key: "firstName" },
          { label: "Achternaam", key: "lastName" },
          { label: "E-mail", key: "email" },
          { label: "Telefoon", key: "phone" },
          { label: "Adres", key: "address" },
          { label: "Geboortedatum", key: "dateOfBirth" },
          { label: "Allergieën", key: "allergies" },
          { label: "Foto URL", key: "photoUrl" },
        ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {person.type === "candidate" ? "Adoptant" : "Wandelaar"} — Detail
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Sluiten
        </button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Laden...</p>
      ) : !detail ? (
        <p className="mt-4 text-sm text-red-600">Persoon niet gevonden.</p>
      ) : (
        <>
          <dl className="mt-4 divide-y divide-gray-100">
            {piiFields.map(({ label, key }) => {
              const value = detail[key];
              const displayValue =
                value === null || value === undefined
                  ? "—"
                  : typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value);

              const isRedacted = displayValue === ANONYMIZED_VALUE;

              return (
                <div key={key} className="flex justify-between py-2.5">
                  <dt className="text-sm font-medium text-gray-500">{label}</dt>
                  <dd
                    className={`text-sm ${isRedacted ? "font-medium italic text-red-600" : "text-gray-900"}`}
                  >
                    {displayValue}
                  </dd>
                </div>
              );
            })}
            {detail.anonymisedAt != null && (
              <div className="flex justify-between py-2.5">
                <dt className="text-sm font-medium text-gray-500">Geanonimiseerd op</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(detail.anonymisedAt as string).toLocaleString("nl-BE")}
                </dd>
              </div>
            )}
          </dl>

          {message && (
            <div
              className={`mt-4 rounded-lg p-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
            >
              {message.text}
            </div>
          )}

          {!isAnonymised && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={handleAnonymize}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Bezig met anonimiseren..." : "Anonimiseren"}
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Deze actie is onomkeerbaar. Alle persoonsgegevens worden permanent gewist.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
