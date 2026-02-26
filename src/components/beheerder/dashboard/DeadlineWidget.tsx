import Link from "next/link";
import { getIbnDeadlineAlerts } from "@/lib/queries/animals";
import { daysUntil } from "@/lib/utils/date";

function urgencyColor(days: number): string {
  if (days <= 0) return "text-red-700 bg-red-100";
  if (days <= 3) return "text-orange-700 bg-orange-100";
  return "text-yellow-700 bg-yellow-100";
}

export default async function DeadlineWidget() {
  const alerts = await getIbnDeadlineAlerts();

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">⏰</span>
        <h3 className="font-heading text-sm font-bold text-[#1b4332]">
          IBN-Deadlines
        </h3>
        {alerts.length > 0 && (
          <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
            {alerts.length}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <p className="mt-4 text-center text-sm text-gray-400">
          Geen IBN-deadlines
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {alerts.map((animal) => {
            const days = animal.ibnDecisionDeadline
              ? daysUntil(animal.ibnDecisionDeadline)
              : 0;
            const label =
              days <= 0
                ? "Verlopen!"
                : days === 1
                  ? "Morgen"
                  : `${days} dagen`;

            return (
              <li key={animal.id}>
                <Link
                  href={`/beheerder/dieren/${animal.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-800">
                    {animal.name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${urgencyColor(days)}`}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
