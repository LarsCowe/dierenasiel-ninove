"use client";

import { useActionState, useEffect, useRef, useState, startTransition } from "react";
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

  // Controlled state — voorkomt dat React 19 de DOM reset na een failed action.
  const [code, setCode] = useState("");
  const [zone, setZone] = useState("");
  const [capacity, setCapacity] = useState("2");
  const [notes, setNotes] = useState("");
  const [posX, setPosX] = useState("");
  const [posY, setPosY] = useState("");
  const [posW, setPosW] = useState("");
  const [posH, setPosH] = useState("");
  const [layer, setLayer] = useState(String(defaultLayer));

  useEffect(() => {
    setLayer(String(defaultLayer));
  }, [defaultLayer]);

  useEffect(() => {
    if (state?.success) {
      setCode("");
      setZone("");
      setCapacity("2");
      setNotes("");
      setPosX("");
      setPosY("");
      setPosW("");
      setPosH("");
      setLayer(String(defaultLayer));
    }
  }, [state, defaultLayer]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("code", code);
    fd.append("zone", zone);
    fd.append("capacity", capacity);
    if (notes) fd.append("notes", notes);
    fd.append("posX", posX);
    fd.append("posY", posY);
    fd.append("posW", posW);
    fd.append("posH", posH);
    fd.append("layer", layer);
    startTransition(() => action(fd));
  }

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
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3 p-4">
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
              value={code}
              onChange={(e) => setCode(e.target.value)}
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
                value={zone}
                onChange={(e) => setZone(e.target.value)}
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
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-0.5 block w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </div>

          <fieldset className="rounded border border-gray-200 p-2">
            <legend className="px-1 text-[10px] font-semibold uppercase text-gray-500">
              Positie (% — optioneel, leeg = niet op plan)
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
                name="layer"
                type="number"
                min={1}
                max={9}
                value={layer}
                onChange={(e) => setLayer(e.target.value)}
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
