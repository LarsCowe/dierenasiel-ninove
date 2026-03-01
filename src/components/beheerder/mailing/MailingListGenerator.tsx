"use client";

import { useState } from "react";
import { generateMailingListWrapper } from "@/app/(beheerder)/beheerder/mailing/actions";
import { SPECIES_LABELS } from "@/lib/constants";
import type { MailingRecipient } from "@/types";
import RecipientPreviewTable from "./RecipientPreviewTable";
import SendMailForm from "./SendMailForm";

export default function MailingListGenerator() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [species, setSpecies] = useState("");
  const [recipients, setRecipients] = useState<MailingRecipient[] | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<MailingRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setRecipients(null);
    setSelectedRecipients([]);

    const filters: Record<string, string> = {};
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (species) filters.species = species;

    const result = await generateMailingListWrapper(filters);

    if (result.success) {
      setRecipients(result.data);
      setSelectedRecipients(result.data);
    } else {
      setError(result.error || "Er ging iets mis.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="dateFrom" className="block text-xs font-medium text-gray-600">Van</label>
          <input
            type="date"
            id="dateFrom"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="dateTo" className="block text-xs font-medium text-gray-600">Tot</label>
          <input
            type="date"
            id="dateTo"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="species" className="block text-xs font-medium text-gray-600">Soort</label>
          <select
            id="species"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">Alle soorten</option>
            {Object.entries(SPECIES_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Bezig..." : "Genereer lijst"}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {recipients !== null && (
        <>
          <p className="text-sm text-gray-600">{recipients.length} adoptanten gevonden.</p>
          {recipients.length > 0 && (
            <>
              <RecipientPreviewTable
                recipients={recipients}
                selectedRecipients={selectedRecipients}
                onSelectionChange={setSelectedRecipients}
              />
              <SendMailForm recipients={selectedRecipients} />
            </>
          )}
        </>
      )}
    </div>
  );
}
