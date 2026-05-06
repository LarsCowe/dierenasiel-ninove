"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { MunicipalityLogo } from "@/types";

interface Props {
  logos: MunicipalityLogo[];
}

export default function LogoLibraryGrid({ logos }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [addFileName, setAddFileName] = useState<string | null>(null);
  const [editFileNames, setEditFileNames] = useState<Record<number, string>>({});

  // Add-form state
  const addNameRef = useRef<HTMLInputElement>(null);
  const addFileRef = useRef<HTMLInputElement>(null);

  // Edit-form per row
  const editNameRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const editFileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  async function handleAdd() {
    setError(null);
    const name = addNameRef.current?.value.trim() ?? "";
    const file = addFileRef.current?.files?.[0];
    if (!name || !file) {
      setError("Naam en bestand zijn verplicht");
      return;
    }
    setIsUploading(true);
    const fd = new FormData();
    fd.append("name", name);
    fd.append("file", file);
    try {
      const res = await fetch("/api/zwerfkatten/logos", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload mislukt");
      } else {
        setShowAdd(false);
        if (addNameRef.current) addNameRef.current.value = "";
        if (addFileRef.current) addFileRef.current.value = "";
        setAddFileName(null);
        router.refresh();
      }
    } catch {
      setError("Upload mislukt. Probeer opnieuw.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleEdit(logoId: number) {
    setError(null);
    const name = editNameRefs.current[logoId]?.value.trim() ?? "";
    const file = editFileRefs.current[logoId]?.files?.[0];
    if (!name) {
      setError("Naam is verplicht");
      return;
    }
    setIsUploading(true);
    const fd = new FormData();
    fd.append("name", name);
    if (file) fd.append("file", file);
    try {
      const res = await fetch(`/api/zwerfkatten/logos/${logoId}`, { method: "PATCH", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Bijwerken mislukt");
      } else {
        setEditingId(null);
        router.refresh();
      }
    } catch {
      setError("Bijwerken mislukt. Probeer opnieuw.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleDelete(logoId: number) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/zwerfkatten/logos/${logoId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Verwijderen mislukt");
      } else {
        setConfirmDeleteId(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {logos.length} opdrachtgever{logos.length !== 1 ? "s" : ""}
        </p>
        {!showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-700 transition hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nieuwe opdrachtgever
          </button>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      {showAdd && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-[#1b4332]">Nieuwe opdrachtgever</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Naam *</label>
              <input
                ref={addNameRef}
                type="text"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="bv. Gemeente Ninove"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Logo *</label>
              <div className="mt-1 flex items-center gap-2">
                <label
                  htmlFor="logo-add-file"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  Bestand kiezen
                </label>
                <input
                  id="logo-add-file"
                  ref={addFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => setAddFileName(e.target.files?.[0]?.name ?? null)}
                  className="hidden"
                />
                <span className="truncate text-xs text-gray-500">
                  {addFileName ?? "Geen bestand gekozen"}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">PNG, JPEG, WebP of SVG · max 2MB</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={isUploading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isUploading ? "Bezig..." : "Opslaan"}
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setError(null); }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {logos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
          <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="mt-3 text-sm text-gray-500">Nog geen opdrachtgevers in de bibliotheek.</p>
          {!showAdd && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-700 transition hover:bg-emerald-700 hover:shadow-md"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Eerste opdrachtgever toevoegen
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {logos.map((logo) => (
            <div
              key={logo.id}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex h-32 w-full items-center justify-center rounded-lg bg-gray-50">
                <Image
                  src={logo.logoUrl}
                  alt={logo.name}
                  width={120}
                  height={120}
                  unoptimized
                  className="max-h-28 max-w-full object-contain"
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-gray-800">{logo.name}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => { setEditingId(editingId === logo.id ? null : logo.id); setError(null); }}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    title="Bewerken"
                    aria-label="Bewerken"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setConfirmDeleteId(logo.id); setError(null); }}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Verwijderen"
                    aria-label="Verwijderen"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {editingId === logo.id && (
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                  <input
                    ref={(el) => { editNameRefs.current[logo.id] = el; }}
                    defaultValue={logo.name}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`logo-edit-file-${logo.id}`}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                      Vervang afbeelding
                    </label>
                    <input
                      id={`logo-edit-file-${logo.id}`}
                      ref={(el) => { editFileRefs.current[logo.id] = el; }}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(e) => setEditFileNames((prev) => ({ ...prev, [logo.id]: e.target.files?.[0]?.name ?? "" }))}
                      className="hidden"
                    />
                    {editFileNames[logo.id] && (
                      <span className="truncate text-xs text-gray-500">{editFileNames[logo.id]}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">Optioneel</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(logo.id)}
                      disabled={isUploading}
                      className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isUploading ? "Bezig..." : "Opslaan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Annuleer
                    </button>
                  </div>
                </div>
              )}

              {confirmDeleteId === logo.id && (
                <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-600">Verwijderen?</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(logo.id)}
                    disabled={isPending}
                    className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isPending ? "Bezig..." : "Ja"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Annuleer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
