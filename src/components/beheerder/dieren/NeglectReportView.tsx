import type { NeglectReport } from "@/types";

interface NeglectReportViewProps {
  report: NeglectReport;
  onEdit?: () => void;
}

export default function NeglectReportView({ report, onEdit }: NeglectReportViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="text-xs font-medium text-gray-500">Datum onderzoek</p>
          <p className="mt-1 text-sm text-gray-800">{report.date || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Dierenarts</p>
          <p className="mt-1 text-sm text-gray-800">{report.vetName || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Gewicht bij aankomst</p>
          <p className="mt-1 text-sm text-gray-800">{report.weightOnArrival || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Aangemaakt</p>
          <p className="mt-1 text-sm text-gray-800">
            {report.createdAt
              ? new Date(report.createdAt).toLocaleDateString("nl-BE")
              : "—"}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500">Gezondheidstoestand bij aankomst</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
          {report.healthStatusOnArrival}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500">Vaststellingen verwaarlozing</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
          {report.neglectFindings}
        </p>
      </div>

      {report.treatmentsGiven && (
        <div>
          <p className="text-xs font-medium text-gray-500">Uitgevoerde behandelingen</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
            {report.treatmentsGiven}
          </p>
        </div>
      )}

      {report.notes && (
        <div>
          <p className="text-xs font-medium text-gray-500">Opmerkingen</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
            {report.notes}
          </p>
        </div>
      )}

      {report.photos && report.photos.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500">Bewijsfoto&apos;s</p>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {report.photos.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Bewijsfoto verwaarlozing"
                  className="h-24 w-full rounded-lg object-cover hover:opacity-80"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Rapport bewerken
        </button>
      )}
    </div>
  );
}
