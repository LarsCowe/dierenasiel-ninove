interface ComplianceHeaderProps {
  total: number;
  checked: number;
}

export default function ComplianceHeader({ total, checked }: ComplianceHeaderProps) {
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

  let colorClass: string;
  let barColor: string;
  if (pct >= 95) {
    colorClass = "text-emerald-700";
    barColor = "bg-emerald-500";
  } else if (pct >= 80) {
    colorClass = "text-amber-700";
    barColor = "bg-amber-500";
  } else {
    colorClass = "text-red-700";
    barColor = "bg-red-500";
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Actieve medicaties</p>
        <p className="mt-1 text-2xl font-bold text-[#1b4332]">{total}</p>
      </div>
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">Afgevinkt vandaag</p>
        <p className="mt-1 text-2xl font-bold text-emerald-700">{checked}</p>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Compliance</p>
        <p className={`mt-1 text-2xl font-bold ${colorClass}`}>{pct}%</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full ${barColor} transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
