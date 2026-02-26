import Link from "next/link";
import { getMedicalAlerts } from "@/lib/queries/medical-alerts";
import { daysUntil, urgencyColor, deadlineLabel } from "@/lib/utils/date";

const CATEGORY_ICON: Record<string, string> = {
  vaccination: "\u{1F489}",
  medication: "\u{1F48A}",
};

export default async function AlertWidget() {
  const alerts = await getMedicalAlerts(15);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">{"\u26A0\uFE0F"}</span>
        <h3 className="font-heading text-sm font-bold text-[#1b4332]">
          Medische Alerts
        </h3>
        {alerts.length > 0 && (
          <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
            {alerts.length}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <p className="mt-4 text-center text-sm text-gray-400">
          Geen medische alerts
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {alerts.map((alert) => {
            const days = daysUntil(alert.dueDate);

            return (
              <li key={`${alert.category}-${alert.animalId}-${alert.dueDate}-${alert.label}`}>
                <Link
                  href={`/beheerder/dieren/${alert.animalId}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-gray-800">
                      {alert.animalName}
                    </span>
                    <span className="ml-1.5 text-gray-400">
                      {CATEGORY_ICON[alert.category]} {alert.label}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${urgencyColor(days)}`}
                  >
                    {deadlineLabel(days)}
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
