import type { BehaviorRecord } from "@/types";

const SCORE_LABELS: Record<number, string> = {
  1: "Zeer goed",
  2: "Goed",
  3: "Neutraal",
  4: "Matig",
  5: "Problematisch",
};

const SCORE_COLORS: Record<number, string> = {
  1: "bg-emerald-500",
  2: "bg-green-400",
  3: "bg-yellow-400",
  4: "bg-orange-400",
  5: "bg-red-500",
};

const CATEGORY_LABELS: Record<string, string> = {
  benaderingHok: "Nadering hok",
  uitHetHok: "Uit hok halen",
  wandelingLeiband: "Wandeling leiband",
  reactieAndereHonden: "Andere honden",
  reactieMensen: "Mensen/kinderen",
  aanrakingManipulatie: "Aanraking",
  voedselgedrag: "Voedselgedrag",
};

interface BehaviorRecordListProps {
  records: BehaviorRecord[];
  onEdit?: (record: BehaviorRecord) => void;
}

export default function BehaviorRecordList({ records, onEdit }: BehaviorRecordListProps) {
  if (records.length === 0) {
    return (
      <p className="text-sm text-gray-500">Nog geen gedragsfiches ingevuld.</p>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => {
        const checklist = record.checklist as Record<string, unknown>;
        const aandachtspunten = (checklist?.aandachtspunten as string[]) ?? [];

        return (
          <details
            key={record.id}
            className="rounded-lg border border-gray-200 bg-white"
          >
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-800">
                  {record.date}
                </span>
                <div className="flex gap-1">
                  {Object.keys(CATEGORY_LABELS).map((key) => {
                    const score = checklist?.[key] as number;
                    return (
                      <span
                        key={key}
                        className={`inline-block h-3 w-3 rounded-full ${SCORE_COLORS[score] ?? "bg-gray-300"}`}
                        title={`${CATEGORY_LABELS[key]}: ${score} — ${SCORE_LABELS[score] ?? "?"}`}
                      />
                    );
                  })}
                </div>
                {aandachtspunten.length > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {aandachtspunten.length} aandachtspunt{aandachtspunten.length > 1 ? "en" : ""}
                  </span>
                )}
              </div>
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit(record);
                  }}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Bewerken
                </button>
              )}
            </summary>

            <div className="border-t border-gray-100 px-4 py-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                  const score = checklist?.[key] as number;
                  return (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{label}</span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${SCORE_COLORS[score] ?? "bg-gray-300"}`}
                        />
                        <span className="font-medium text-gray-800">
                          {score} — {SCORE_LABELS[score] ?? "?"}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex gap-4 border-t border-gray-100 pt-3 text-sm">
                <div>
                  <span className="text-gray-500">Zindelijk: </span>
                  <span className="font-medium text-gray-800">
                    {checklist?.zindelijk === true
                      ? "Ja"
                      : checklist?.zindelijk === false
                        ? "Nee"
                        : "Onbekend"}
                  </span>
                </div>
              </div>

              {aandachtspunten.length > 0 && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">Aandachtspunten: </span>
                  <span className="font-medium text-gray-800">
                    {aandachtspunten.join(", ")}
                  </span>
                </div>
              )}

              {record.notes && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">Opmerkingen: </span>
                  <span className="text-gray-800">{record.notes}</span>
                </div>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}
