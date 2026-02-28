import type { Walk } from "@/types";
import { formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  planned: { label: "Gepland", bg: "bg-blue-100", text: "text-blue-800" },
  in_progress: { label: "Bezig", bg: "bg-amber-100", text: "text-amber-800" },
  completed: { label: "Voltooid", bg: "bg-emerald-100", text: "text-emerald-800" },
  cancelled: { label: "Geannuleerd", bg: "bg-gray-100", text: "text-gray-500" },
};

interface MyWalksSectionProps {
  walks: Walk[];
}

export default function MyWalksSection({ walks }: MyWalksSectionProps) {
  if (walks.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-[#2d6a4f]/70">
          Je hebt nog geen wandelingen geboekt. Kies een hond hierboven om je eerste wandeling te plannen!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {walks.map((walk) => {
        const status = STATUS_LABELS[walk.status] ?? STATUS_LABELS.planned;
        return (
          <div
            key={walk.id}
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
          >
            <div>
              <p className="text-sm font-medium text-[#1b4332]">
                {formatDate(walk.date)} om {walk.startTime}
              </p>
              {walk.remarks && (
                <p className="mt-0.5 text-xs text-gray-500">{walk.remarks}</p>
              )}
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
