"use client";

import { useState, useTransition } from "react";
import { searchPersonsAction } from "@/app/(beheerder)/beheerder/gdpr/actions";
import type { GdprSearchResult } from "@/types";
import GdprSearchResults from "./GdprSearchResults";

export default function GdprPersonSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GdprSearchResult[] | null>(null);
  const [isPending, startTransition] = useTransition();

  function refreshSearch() {
    if (query.trim().length < 2) return;
    startTransition(async () => {
      const data = await searchPersonsAction(query);
      setResults(data);
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    refreshSearch();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op naam of e-mailadres..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          minLength={2}
        />
        <button
          type="submit"
          disabled={isPending || query.trim().length < 2}
          className="rounded-lg bg-[#1b4332] px-6 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Zoeken..." : "Zoeken"}
        </button>
      </form>

      {results !== null && <GdprSearchResults results={results} onRefresh={refreshSearch} />}
    </div>
  );
}
