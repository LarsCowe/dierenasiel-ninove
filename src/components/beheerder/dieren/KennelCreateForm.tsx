"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createKennel } from "@/lib/actions/kennels";
import { KENNEL_ZONES } from "@/lib/validations/kennels";

const ZONE_LABELS: Record<string, string> = {
  honden: "Honden",
  katten: "Katten",
  andere: "Andere",
};

interface Props {
  defaultLayer?: number;
}

export default function KennelCreateForm({ defaultLayer = 1 }: Props = {}) {
  const [state, action, isPending] = useActionState(createKennel, null);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/40 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between px-4 py-2 text-left ${open ? "border-b border-sky-200" : ""}`}
      >
        <span className="text-sm font-medium text-sky-800">
          + Nieuw vak toevoegen
        </span>
        <span className="text-xs text-sky-700">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <form ref={formRef} action={action} className="space-y-3 p-4">
          <div>
            <label htmlFor="new-code" className="block text-[10px] font-medium uppercase text-gray-500">
              Code *
            </label>
            <input
              id="new-code"
              name="code"
              required
              maxLength={10}
              placeholder="bv. H13"
              className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="new-zone" className="block text-[10px] font-medium uppercase text-gray-500">
                Zone *
              </label>
              <select
                id="new-zone"
                name="zone"
                required
                defaultValue=""
                className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm"
              >
                <option value="" disabled>Kies...</option>
                {KENNEL_ZONES.map((z) => (
                  <option key={z} value={z}>{ZONE_LABELS[z]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="new-capacity" className="block text-[10px] font-medium uppercase text-gray-500">
                Capaciteit *
              </label>
              <input
                id="new-capacity"
                name="capacity"
                type="number"
                required
                min={1}
                max={20}
                defaultValue={2}
                className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="new-notes" className="block text-[10px] font-medium uppercase text-gray-500">
              Opmerkingen
            </label>
            <input
              id="new-notes"
              name="notes"
              maxLength={500}
              className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </div>

          <fieldset className="rounded border border-gray-200 p-2">
            <legend className="px-1 text-[10px] font-semibold uppercase text-gray-500">
              Positie (% — optioneel, leeg = niet op plan)
            </legend>
            <div className="grid grid-cols-4 gap-2">
              <PosInput label="X" name="posX" />
              <PosInput label="Y" name="posY" />
              <PosInput label="Breedte" name="posW" />
              <PosInput label="Hoogte" name="posH" />
            </div>
            <div className="mt-2">
              <label className="block text-[10px] font-medium text-gray-500">Laag</label>
              <input
                name="layer"
                type="number"
                min={1}
                max={9}
                defaultValue={defaultLayer}
                key={defaultLayer}
                className="mt-0.5 block w-20 rounded border border-gray-300 px-1.5 py-1 text-xs"
              />
            </div>
          </fieldset>

          {state && !state.success && state.error && (
            <p className="text-xs text-red-600">{state.error}</p>
          )}
          {state?.success && state.message && (
            <p className="text-xs text-emerald-600">{state.message}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="rounded-md border border-sky-300 bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800 hover:bg-sky-200 disabled:opacity-50"
          >
            {isPending ? "Aanmaken..." : "Toevoegen"}
          </button>
        </form>
      )}
    </div>
  );
}

function PosInput({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-gray-500">{label}</label>
      <input
        name={name}
        type="number"
        step="0.1"
        min={0}
        max={100}
        className="mt-0.5 block w-full rounded border border-gray-300 px-1.5 py-1 text-xs"
      />
    </div>
  );
}
