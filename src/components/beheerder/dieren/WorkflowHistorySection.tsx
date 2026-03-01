import { formatDate } from "@/lib/utils";
import { PHASE_LABELS } from "@/lib/workflow/stepbar";
import type { WorkflowHistoryEntry } from "@/types";

interface WorkflowHistorySectionProps {
  entries: WorkflowHistoryEntry[];
}

function phaseLabel(phase: string | null): string {
  if (!phase) return "—";
  return PHASE_LABELS[phase] ?? phase;
}

function AutoActions({ actions }: { actions: unknown }) {
  if (!actions) return null;
  const list = Array.isArray(actions) ? actions as string[] : [];
  if (list.length === 0) return null;

  return (
    <details className="mt-1">
      <summary className="cursor-pointer text-xs text-gray-500">
        {list.length} {list.length === 1 ? "taak" : "taken"} aangemaakt
      </summary>
      <ul className="mt-1 list-inside list-disc text-xs text-gray-500">
        {list.map((action, i) => (
          <li key={i}>{action}</li>
        ))}
      </ul>
    </details>
  );
}

export default function WorkflowHistorySection({ entries }: WorkflowHistorySectionProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-gray-500">Nog geen workflow-historie voor dit dier.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-100 bg-gray-50">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-600">Datum</th>
            <th className="px-4 py-3 font-medium text-gray-600">Overgang</th>
            <th className="px-4 py-3 font-medium text-gray-600">Door</th>
            <th className="px-4 py-3 font-medium text-gray-600">Reden / Acties</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="whitespace-nowrap px-4 py-3 text-gray-800">
                {formatDate(entry.createdAt)}
              </td>
              <td className="px-4 py-3 font-medium text-[#1b4332]">
                {phaseLabel(entry.fromPhase)} → {phaseLabel(entry.toPhase)}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {entry.changedByName ?? "Onbekend"}
              </td>
              <td className="px-4 py-3">
                {entry.changeReason ? (
                  <span className="text-sm text-amber-700">
                    ⚠ {entry.changeReason}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
                <AutoActions actions={entry.autoActionsTriggered} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
