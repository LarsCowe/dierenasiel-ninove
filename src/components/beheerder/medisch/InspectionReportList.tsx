import Link from "next/link";
import type { VetInspectionReport, TreatedAnimalEntry, EuthanizedAnimalEntry } from "@/types";

interface Props {
  reports: VetInspectionReport[];
}

export default function InspectionReportList({ reports }: Props) {
  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">
          Er zijn nog geen bezoekrapporten. Maak een nieuw rapport aan.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
            <th className="px-4 py-3">Datum</th>
            <th className="px-4 py-3">Dierenarts</th>
            <th className="px-4 py-3 text-center">Behandeld</th>
            <th className="px-4 py-3 text-center">Euthanasie</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {reports.map((report) => {
            const treatedCount = ((report.animalsTreated ?? []) as TreatedAnimalEntry[]).length;
            const euthanizedCount = ((report.animalsEuthanized ?? []) as EuthanizedAnimalEntry[]).length;

            return (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{new Date(report.visitDate + "T00:00:00").toLocaleDateString("nl-BE")}</td>
                <td className="px-4 py-3 text-gray-600">{report.vetName}</td>
                <td className="px-4 py-3 text-center text-gray-600">{treatedCount}</td>
                <td className="px-4 py-3 text-center text-gray-600">{euthanizedCount}</td>
                <td className="px-4 py-3">
                  {report.vetSignature ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      Ondertekend
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      Concept
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/beheerder/medisch/bezoekrapport/${report.id}`}
                    className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
                  >
                    Bekijken
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
