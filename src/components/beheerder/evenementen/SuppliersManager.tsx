"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSupplier, type SupplierRow } from "@/lib/actions/suppliers";
import { contactLinks } from "@/lib/events/suppliers";
import SupplierContact from "./SupplierContact";
import SupplierForm from "./SupplierForm";

type Rij = SupplierRow & { eventCount: number };

interface Props {
  suppliers: Rij[];
  canWrite: boolean;
}

function gebruikLabel(n: number): string {
  if (n === 0) return "Nog niet gebruikt";
  return n === 1 ? "1 evenement" : `${n} evenementen`;
}

/**
 * Story 13.16 — de leverancierslijst. Een naam die je bij een kost of materiaal typt,
 * komt hier vanzelf bij; hier vul je de gegevens aan, en die gelden meteen overal.
 */
export default function SuppliersManager({ suppliers, canWrite }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [nieuw, setNieuw] = useState(false);
  const [bewerktId, setBewerktId] = useState<number | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  function verwijderen(s: Rij) {
    const vraag =
      `Leverancier "${s.name}" verwijderen? De kosten- en materiaalregels houden de naam; ` +
      "enkel de contactgegevens verdwijnen.";
    if (!window.confirm(vraag)) return;
    setFout(null);
    startTransition(async () => {
      const res = await deleteSupplier(s.id);
      if (res.success) router.refresh();
      else setFout(res.error ?? "Verwijderen mislukt");
    });
  }

  return (
    <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      {fout && <p className="mb-2 text-sm text-red-600">{fout}</p>}

      {suppliers.length === 0 ? (
        <p className="text-sm text-gray-400">
          Nog geen leveranciers. Een naam die je bij een kost of bij materiaal invult, komt hier
          vanzelf bij.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Leveranciers</caption>
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                <th scope="col" className="py-1 font-medium">Naam</th>
                <th scope="col" className="py-1 font-medium">Contact</th>
                <th scope="col" className="py-1 font-medium">Gebruikt</th>
                {canWrite && <th scope="col" className="py-1" />}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) =>
                bewerktId === s.id ? (
                  <tr key={s.id}>
                    <td colSpan={canWrite ? 4 : 3} className="py-2">
                      <SupplierForm supplier={s} onDone={() => setBewerktId(null)} />
                    </td>
                  </tr>
                ) : (
                  <tr key={s.id} className="border-b border-gray-100 align-top">
                    <td className="py-1.5 pr-2">
                      <span className="font-medium text-gray-900">{s.name}</span>
                      {s.notes && <span className="block text-xs text-gray-500">{s.notes}</span>}
                    </td>
                    <td className="py-1.5 pr-2">
                      {contactLinks(s).length > 0 ? (
                        <SupplierContact supplier={s} />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-2 text-xs text-gray-600">{gebruikLabel(s.eventCount)}</td>
                    {canWrite && (
                      <td className="py-1.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setNieuw(false);
                            setBewerktId(s.id);
                          }}
                          className="rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                        >
                          Bewerken
                        </button>
                        <button
                          type="button"
                          onClick={() => verwijderen(s)}
                          className="rounded px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                        >
                          Verwijderen
                        </button>
                      </td>
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      {canWrite &&
        (nieuw ? (
          <div className="mt-3">
            <SupplierForm onDone={() => setNieuw(false)} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setBewerktId(null);
              setNieuw(true);
            }}
            className="mt-3 text-sm font-medium text-[#2d6a4f] hover:underline"
          >
            + Nieuwe leverancier
          </button>
        ))}
    </section>
  );
}
