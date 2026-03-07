import Link from "next/link";
import { getAnimalReport } from "@/lib/queries/reports";
import { getBehaviorReportByAnimalId } from "@/lib/queries/reports";
import { getAnimalById } from "@/lib/queries/animals";
import { BEHAVIOR_VERZORGERS_ITEMS, BEHAVIOR_HONDEN_ITEMS } from "@/lib/constants";
import AnimalSelect from "@/components/beheerder/rapporten/AnimalSelect";

function formatBool(val: unknown): string {
  if (val === true) return "Ja";
  if (val === false) return "Nee";
  return "—";
}

function BoolCell({ val, positive }: { val: unknown; positive?: boolean }) {
  if (val === true) {
    const cls = positive
      ? "text-emerald-700 bg-emerald-50"
      : "text-red-700 bg-red-50";
    return <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>Ja</span>;
  }
  if (val === false) {
    const cls = positive
      ? "text-red-700 bg-red-50"
      : "text-emerald-700 bg-emerald-50";
    return <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>Nee</span>;
  }
  return <span className="text-xs text-gray-400">—</span>;
}

const POSITIVE_KEYS = new Set([
  "verzorgers_gemakkelijkWandeling",
  "verzorgers_speeltGraag",
  "honden_speeltGraag",
]);

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GedragsfichesRapportPage({ searchParams }: Props) {
  const params = await searchParams;
  const animalIdStr = typeof params.dier === "string" ? params.dier : undefined;
  const animalId = animalIdStr ? parseInt(animalIdStr, 10) : undefined;

  const { animals: dogs } = await getAnimalReport({ species: "hond" });

  const selectedAnimal = animalId ? await getAnimalById(animalId) : null;
  const records = animalId ? await getBehaviorReportByAnimalId(animalId) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/beheerder/rapporten"
            className="text-sm text-emerald-700 hover:text-emerald-800"
          >
            &larr; Terug naar rapporten
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            R4 — Gedragsfiches per hond
          </h1>
        </div>
        {animalId && selectedAnimal && (
          <a
            href={`/api/rapporten/gedragsfiches/${animalId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF Export
          </a>
        )}
      </div>

      <AnimalSelect
        animals={dogs.map((d) => ({ id: d.id, name: d.name, breed: d.breed }))}
        selectedId={animalIdStr}
      />

      {selectedAnimal && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedAnimal.name}
              <span className="ml-2 text-sm font-normal text-gray-500">
                {selectedAnimal.species} {selectedAnimal.breed ? `— ${selectedAnimal.breed}` : ""}
              </span>
            </h2>
            <p className="text-sm text-gray-500">{records.length} gedragsfiche(s) gevonden</p>
          </div>

          {records.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
              Geen gedragsfiches gevonden voor deze hond.
            </div>
          ) : (
            records.map((record, idx) => {
              const checklist = record.checklist as Record<string, unknown>;
              return (
                <div key={record.id} className="rounded-lg border border-gray-200 bg-white">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Gedragsfiche {idx + 1} — {record.date}
                    </h3>
                  </div>

                  {/* Sectie 1 */}
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-xs font-semibold text-[#1b4332] uppercase tracking-wide mb-2">
                      1. Gedrag tegenover de verzorgers
                    </p>
                    <table className="w-full">
                      <tbody className="divide-y divide-gray-100">
                        {BEHAVIOR_VERZORGERS_ITEMS.map((item) => (
                          <tr key={item.key}>
                            <td className="py-1.5 text-sm text-gray-700">{item.label}</td>
                            <td className="py-1.5 text-right">
                              <BoolCell val={checklist[item.key]} positive={POSITIVE_KEYS.has(item.key)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {typeof checklist.verzorgers_andere === "string" && checklist.verzorgers_andere && (
                      <p className="mt-1 text-xs text-gray-500">
                        Andere: <span className="text-gray-700">{String(checklist.verzorgers_andere)}</span>
                      </p>
                    )}
                  </div>

                  {/* Sectie 2 */}
                  <div className="px-4 pt-3 pb-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-[#1b4332] uppercase tracking-wide mb-2">
                      2. Gedrag tegenover andere honden
                    </p>
                    <table className="w-full">
                      <tbody className="divide-y divide-gray-100">
                        {BEHAVIOR_HONDEN_ITEMS.map((item) => (
                          <tr key={item.key}>
                            <td className="py-1.5 text-sm text-gray-700">{item.label}</td>
                            <td className="py-1.5 text-right">
                              <BoolCell val={checklist[item.key]} positive={POSITIVE_KEYS.has(item.key)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {typeof checklist.honden_andere === "string" && checklist.honden_andere && (
                      <p className="mt-1 text-xs text-gray-500">
                        Andere: <span className="text-gray-700">{String(checklist.honden_andere)}</span>
                      </p>
                    )}
                  </div>

                  {record.notes && (
                    <div className="border-t border-gray-100 px-4 py-3">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Opmerkingen</p>
                      <p className="text-sm text-gray-700">{record.notes}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {!animalId && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
          Selecteer een hond om de gedragsfiches te bekijken.
        </div>
      )}
    </div>
  );
}
