"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCageAction,
  updateCageAction,
  deleteCageAction,
} from "@/lib/actions/cages";
import type { Cage } from "@/types";

interface Props {
  cages: Cage[];
  occupied: Record<string, number>;
}

export default function CageManagementGrid({ cages, occupied }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Add-form state — controlled (React 19 retention)
  const [addCode, setAddCode] = useState("");
  const [addNotes, setAddNotes] = useState("");

  function resetAddForm() {
    setAddCode("");
    setAddNotes("");
    setError(null);
  }

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const result = await createCageAction({ code: addCode, notes: addNotes });
      if (!result.success) {
        setError(result.error || "Aanmaken mislukt");
      } else {
        setShowAdd(false);
        resetAddForm();
        router.refresh();
      }
    });
  }

  function handleDelete(cageId: number) {
    setError(null);
    startTransition(async () => {
      const result = await deleteCageAction(cageId);
      if (!result.success) {
        setError(result.error || "Verwijderen mislukt");
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
          {cages.length} koo{cages.length !== 1 ? "ien" : "i"}
        </p>
        {!showAdd && (
          <button
            type="button"
            onClick={() => { setShowAdd(true); setError(null); }}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-emerald-700 transition hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nieuwe kooi
          </button>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      {showAdd && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-[#1b4332]">Nieuwe kooi</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Code *</label>
              <input
                type="text"
                value={addCode}
                onChange={(e) => setAddCode(e.target.value)}
                maxLength={20}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="bv. K21"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notities</label>
              <input
                type="text"
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                maxLength={500}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="Optioneel"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending || !addCode.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? "Bezig..." : "Opslaan"}
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); resetAddForm(); }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {cages.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-gray-500">Nog geen kooien in de bibliotheek.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Notities</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="w-32 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cages.map((cage) => (
                <CageRow
                  key={cage.id}
                  cage={cage}
                  inUseCampaignId={occupied[cage.code]}
                  editing={editingId === cage.id}
                  confirmDelete={confirmDeleteId === cage.id}
                  isPending={isPending}
                  onEdit={() => { setEditingId(cage.id); setConfirmDeleteId(null); setError(null); }}
                  onCancelEdit={() => setEditingId(null)}
                  onAfterEdit={() => { setEditingId(null); setError(null); router.refresh(); }}
                  onSetEditError={setError}
                  onConfirmDelete={() => { setConfirmDeleteId(cage.id); setEditingId(null); setError(null); }}
                  onCancelDelete={() => setConfirmDeleteId(null)}
                  onConfirmDeleteAction={() => handleDelete(cage.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Tip: een kooi die momenteel is uitgezet in een lopende campagne kan niet worden verwijderd.{" "}
        <Link href="/beheerder/dieren/zwerfkattenbeleid" className="text-emerald-700 hover:underline">
          Bekijk campagnes →
        </Link>
      </p>
    </div>
  );
}

function CageRow({
  cage,
  inUseCampaignId,
  editing,
  confirmDelete,
  isPending,
  onEdit,
  onCancelEdit,
  onAfterEdit,
  onSetEditError,
  onConfirmDelete,
  onCancelDelete,
  onConfirmDeleteAction,
}: {
  cage: Cage;
  inUseCampaignId: number | undefined;
  editing: boolean;
  confirmDelete: boolean;
  isPending: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onAfterEdit: () => void;
  onSetEditError: (err: string | null) => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDeleteAction: () => void;
}) {
  const [code, setCode] = useState(cage.code);
  const [notes, setNotes] = useState(cage.notes ?? "");
  const [isEditing, startEdit] = useTransition();

  // Synchroniseer de lokale state als de cage van buiten wijzigt
  // (bv. router.refresh na save).
  useEffect(() => {
    setCode(cage.code);
    setNotes(cage.notes ?? "");
  }, [cage.code, cage.notes]);

  function handleSave() {
    onSetEditError(null);
    startEdit(async () => {
      const result = await updateCageAction({ id: cage.id, code, notes });
      if (!result.success) {
        onSetEditError(result.error || "Bijwerken mislukt");
      } else {
        onAfterEdit();
      }
    });
  }

  return (
    <tr className={editing ? "bg-emerald-50/40" : "hover:bg-gray-50"}>
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-800">
        {editing ? (
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={20}
            className="block w-24 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        ) : (
          cage.code
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {editing ? (
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            className="block w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        ) : (
          cage.notes || <span className="text-gray-300">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm">
        {inUseCampaignId !== undefined ? (
          <Link
            href={`/beheerder/dieren/zwerfkattenbeleid/${inUseCampaignId}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 015.656 5.656l-2 2a4 4 0 01-5.656-5.656m4-4l-2 2" />
            </svg>
            In campagne #{inUseCampaignId}
          </Link>
        ) : (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            Beschikbaar
          </span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
        {editing ? (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={isEditing || !code.trim()}
              className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isEditing ? "Bezig..." : "Opslaan"}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Annuleer
            </button>
          </div>
        ) : confirmDelete ? (
          <div className="flex justify-end items-center gap-1.5">
            <span className="text-xs text-gray-600">Verwijderen?</span>
            <button
              type="button"
              onClick={onConfirmDeleteAction}
              disabled={isPending}
              className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? "Bezig..." : "Ja"}
            </button>
            <button
              type="button"
              onClick={onCancelDelete}
              className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Nee
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Bewerk ${cage.code}`}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              title="Bewerken"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onConfirmDelete}
              aria-label={`Verwijder ${cage.code}`}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              title="Verwijderen"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
