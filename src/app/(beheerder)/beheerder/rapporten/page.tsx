import Link from "next/link";
import { REPORT_DEFINITIONS, REPORT_CATEGORIES } from "@/lib/constants";

export default function RapportenOverzichtPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Rapporten</h1>
      <p className="text-sm text-gray-600">
        Genereer rapporten met filters en exporteer als PDF of CSV.
      </p>

      {REPORT_CATEGORIES.map((category) => {
        const reports = REPORT_DEFINITIONS.filter((r) => r.category === category);
        if (reports.length === 0) return null;

        return (
          <section key={category} className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">{category}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => {
                const isAvailable = report.route !== null;

                const card = (
                  <div
                    key={report.id}
                    className={`rounded-lg border p-4 ${
                      isAvailable
                        ? "border-gray-200 bg-white hover:border-emerald-300 hover:shadow-sm transition-all"
                        : "border-gray-100 bg-gray-50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                          {report.id}
                        </span>
                        <h3 className="mt-1 text-sm font-semibold text-gray-900">
                          {report.label}
                        </h3>
                      </div>
                      <div className="flex gap-1">
                        {report.exportFormats.map((fmt) => (
                          <span
                            key={fmt}
                            className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                          >
                            {fmt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">{report.description}</p>
                  </div>
                );

                if (isAvailable) {
                  return (
                    <Link key={report.id} href={report.route!}>
                      {card}
                    </Link>
                  );
                }

                return card;
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
