import voortgang from "@/lib/voortgang/data.json";
import { lastDoneStory, type Epic, type StoryStatus as Status } from "@/lib/voortgang/parse";

/**
 * De lijst komt uit `src/lib/voortgang/data.json`, gemaakt door `npm run voortgang:sync`
 * uit sprint-status.yaml (BMAD). Niet met de hand bijwerken: draai het script.
 */
const EPICS: Epic[] = voortgang.epics as Epic[];
const STAND = voortgang.generatedAt;

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; icon: string }> = {
  done: { label: "Afgerond", bg: "bg-emerald-100", text: "text-emerald-800", icon: "check-circle" },
  review: { label: "In review", bg: "bg-blue-100", text: "text-blue-800", icon: "eye" },
  "in-progress": { label: "In ontwikkeling", bg: "bg-amber-100", text: "text-amber-800", icon: "code" },
  "ready-for-dev": { label: "Klaar voor dev", bg: "bg-purple-100", text: "text-purple-800", icon: "arrow-right" },
  backlog: { label: "Gepland", bg: "bg-gray-100", text: "text-gray-500", icon: "clock" },
};

function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function EpicStatusBadge({ status }: { status: "done" | "in-progress" | "backlog" }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    done: { label: "Afgerond", bg: "bg-emerald-100", text: "text-emerald-800" },
    "in-progress": { label: "Actief", bg: "bg-amber-100", text: "text-amber-800" },
    backlog: { label: "Gepland", bg: "bg-gray-100", text: "text-gray-500" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-600">
        {done}/{total}
      </span>
    </div>
  );
}

export default function VoortgangPage() {
  const allStories = EPICS.flatMap((e) => e.stories);
  const totalStories = allStories.length;
  const doneStories = allStories.filter((s) => s.status === "done").length;
  const reviewStories = allStories.filter((s) => s.status === "review").length;
  const inProgressStories = allStories.filter((s) => s.status === "in-progress").length;
  // Op afrondingsdatum, niet op volgorde in het yaml-bestand (10.64 kwam na 14.3).
  const lastDone = lastDoneStory(EPICS);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
        Projectvoortgang
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Overzicht van alle epics en stories voor het Dierenasiel Ninove platform. Stand van sprint-status op {STAND}.
      </p>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Totaal stories</p>
          <p className="mt-1 text-2xl font-bold text-[#1b4332]">{totalStories}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">Afgerond</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{doneStories}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-600">In review</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">{reviewStories}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-600">In ontwikkeling</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{inProgressStories}</p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Totale voortgang</h2>
          {lastDone && (
            <span className="text-xs text-gray-400">
              Laatst afgerond: Story {lastDone.id}
              {lastDone.doneOn ? ` (${lastDone.doneOn.split("-").reverse().join("/")})` : ""}
            </span>
          )}
        </div>
        <div className="mt-3">
          <ProgressBar done={doneStories} total={totalStories} />
        </div>
      </div>

      {/* Epics */}
      <div className="mt-8 space-y-6">
        {EPICS.map((epic) => {
          const epicDone = epic.stories.filter((s) => s.status === "done").length;
          return (
            <div
              key={epic.id}
              className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              {/* Epic header */}
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1b4332] text-xs font-bold text-white">
                    {epic.id}
                  </span>
                  <h3 className="font-heading text-sm font-bold text-[#1b4332]">
                    {epic.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden text-xs text-gray-400 sm:inline">
                    {epicDone}/{epic.stories.length} stories
                  </span>
                  <EpicStatusBadge status={epic.status} />
                </div>
              </div>

              {/* Epic progress bar */}
              <div className="px-5 pt-3">
                <ProgressBar done={epicDone} total={epic.stories.length} />
              </div>

              {/* Stories list */}
              <div className="divide-y divide-gray-50 px-5 pb-2 pt-2">
                {epic.stories.map((story) => (
                  <div
                    key={story.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      {story.status === "done" ? (
                        <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : story.status === "backlog" ? (
                        <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="9" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span className={`text-sm ${story.status === "done" ? "text-gray-500 line-through" : story.status === "backlog" ? "text-gray-400" : "font-medium text-gray-700"}`}>
                        <span className="font-mono text-xs text-gray-400">{story.id}</span>{" "}
                        {story.title}
                      </span>
                    </div>
                    <StatusBadge status={story.status} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 pb-8 text-center text-xs text-gray-400">
        Laatst bijgewerkt: 4 maart 2026
      </div>
    </div>
  );
}
