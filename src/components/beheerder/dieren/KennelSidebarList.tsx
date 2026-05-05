"use client";

import { useState, useTransition } from "react";
import { deleteKennel, updateKennelAction } from "@/lib/actions/kennels";
import { KENNEL_ZONES } from "@/lib/validations/kennels";
import type { Kennel } from "@/types";

const ZONE_LABELS: Record<string, string> = {
  honden: "Honden",
  katten: "Katten",
  andere: "Andere",
};

interface Props {
  kennels: Kennel[];
  editingId: number | null;
  onEditingChange: (id: number | null) => void;
  onSelectKennel?: (kennel: Kennel) => void;
}

export default function KennelSidebarList({ kennels, editingId, onEditingChange, onSelectKennel }: Props) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="font-heading text-sm font-semibold text-[#1b4332]">
          Kennels ({kennels.length})
        </h2>
      </div>
      <ul className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
        {kennels.map((kennel) => (
          <KennelRow
            key={kennel.id}
            kennel={kennel}
            editing={editingId === kennel.id}
            onEdit={() => {
              onEditingChange(kennel.id);
              onSelectKennel?.(kennel);
            }}
            onClose={() => onEditingChange(null)}
          />
        ))}
        {kennels.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-gray-400">
            Nog geen kennels. Voeg er één toe rechts.
          </li>
        )}
      </ul>
    </div>
  );
}

function KennelRow({
  kennel,
  editing,
  onEdit,
  onClose,
}: {
  kennel: Kennel;
  editing: boolean;
  onEdit: () => void;
  onClose: () => void;
}) {
  if (!editing) {
    return (
      <li>
        <button
          type="button"
          onClick={onEdit}
          className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-50"
        >
          <span>
            <span className="font-medium text-gray-800">{kennel.code}</span>
            <span className="ml-2 text-xs text-gray-500">
              {ZONE_LABELS[kennel.zone] ?? kennel.zone} · cap. {kennel.capacity} · L{kennel.layer ?? 1}
            </span>
          </span>
          {kennel.posX === null && (
            <span
              className="text-[10px] uppercase tracking-wide text-amber-600"
              title="Nog geen positie op grondplan"
            >
              geen pos.
            </span>
          )}
        </button>
      </li>
    );
  }

  return (
    <li className="bg-emerald-50/40 px-4 py-3">
      <KennelEditForm kennel={kennel} onClose={onClose} />
    </li>
  );
}

function KennelEditForm({ kennel, onClose }: { kennel: Kennel; onClose: () => void }) {
  const [code, setCode] = useState(kennel.code);
  const [zone, setZone] = useState<string>(kennel.zone);
  const [capacity, setCapacity] = useState(String(kennel.capacity));
  const [notes, setNotes] = useState(kennel.notes ?? "");
  const [posX, setPosX] = useState(kennel.posX ?? "");
  const [posY, setPosY] = useState(kennel.posY ?? "");
  const [posW, setPosW] = useState(kennel.posW ?? "");
  const [posH, setPosH] = useState(kennel.posH ?? "");
  const [layer, setLayer] = useState(String(kennel.layer ?? 1));

  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Kennel ${kennel.code} verwijderen?`)) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const fd = new FormData();
      fd.set("id", String(kennel.id));
      const result = await deleteKennel(null, fd);
      if (!result.success) {
        setDeleteError(result.error || "Verwijderen mislukt");
      }
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateKennelAction(kennel.id, {
        code,
        zone: zone as "honden" | "katten" | "andere",
        capacity: Number(capacity),
        notes: notes.trim() || undefined,
        posX: posX === "" ? undefined : posX,
        posY: posY === "" ? undefined : posY,
        posW: posW === "" ? undefined : posW,
        posH: posH === "" ? undefined : posH,
        layer: Number(layer) || 1,
      });
      if (!result.success) {
        setError(result.error || "Validatie mislukt");
      } else {
        onClose();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
          Bewerken
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Sluiten
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium uppercase text-gray-500">Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={10}
            className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium uppercase text-gray-500">Zone</label>
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm"
          >
            {KENNEL_ZONES.map((z) => (
              <option key={z} value={z}>{ZONE_LABELS[z]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium uppercase text-gray-500">Capaciteit</label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            min={1}
            max={20}
            className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium uppercase text-gray-500">Opmerkingen</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
      </div>

      <fieldset className="rounded border border-gray-200 p-2">
        <legend className="px-1 text-[10px] font-semibold uppercase text-gray-500">
          Positie op grondplan (% — leeg = niet tonen)
        </legend>
        <div className="grid grid-cols-4 gap-2">
          <PosInput label="X" value={posX} onChange={setPosX} />
          <PosInput label="Y" value={posY} onChange={setPosY} />
          <PosInput label="Breedte" value={posW} onChange={setPosW} />
          <PosInput label="Hoogte" value={posH} onChange={setPosH} />
        </div>
        <div className="mt-2">
          <label className="block text-[10px] font-medium text-gray-500">Laag</label>
          <input
            type="number"
            min={1}
            max={9}
            value={layer}
            onChange={(e) => setLayer(e.target.value)}
            className="mt-0.5 block w-20 rounded border border-gray-300 px-1.5 py-1 text-xs"
          />
        </div>
      </fieldset>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center justify-between gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-[#1b4332] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Opslaan..." : "Opslaan"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          {isDeleting ? "Bezig..." : "Verwijderen"}
        </button>
      </div>
      {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
    </form>
  );
}

function PosInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-gray-500">{label}</label>
      <input
        type="number"
        step="0.1"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 block w-full rounded border border-gray-300 px-1.5 py-1 text-xs"
      />
    </div>
  );
}
