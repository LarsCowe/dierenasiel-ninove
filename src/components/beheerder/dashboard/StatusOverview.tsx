interface StatusOverviewProps {
  statuses: { status: string; count: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  beschikbaar: "Beschikbaar",
  in_behandeling: "In behandeling",
  gereserveerd: "Gereserveerd",
  geadopteerd: "Geadopteerd",
  in_quarantaine: "In quarantaine",
  overleden: "Overleden",
  terug_eigenaar: "Terug naar eigenaar",
  geeuthanaseerd: "Geëuthanaseerd",
  ontsnapt: "Ontsnapt",
  niet_ter_adoptie: "Niet ter adoptie",
};

export default function StatusOverview({ statuses }: StatusOverviewProps) {
  const total = statuses.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">📊</span>
        <h3 className="font-heading text-sm font-bold text-[#1b4332]">
          Dieren per Status
        </h3>
      </div>
      {statuses.length === 0 ? (
        <p className="mt-4 text-center text-sm text-gray-400">
          Geen dieren in het systeem
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {statuses.map((item) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.status}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {STATUS_LABELS[item.status ?? ""] ?? item.status ?? "Onbekend"}
                  </span>
                  <span className="font-medium text-gray-700">{item.count}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
