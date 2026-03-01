"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";

interface ReportExportBarProps {
  csvAction: (filters: Record<string, string>) => Promise<{ success: true; data: string } | { success: false; error?: string }>;
  pdfUrl: string;
  filenamePrefix: string;
}

export default function ReportExportBar({ csvAction, pdfUrl, filenamePrefix }: ReportExportBarProps) {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  function buildQueryString() {
    return searchParams.toString();
  }

  function buildFilterObject() {
    const obj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== "pagina") obj[key] = value;
    });
    return obj;
  }

  function handleCsvExport() {
    startTransition(async () => {
      const result = await csvAction(buildFilterObject());
      if (result.success) {
        const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filenamePrefix}-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert(result.error ?? "Er ging iets mis bij het exporteren.");
      }
    });
  }

  const pdfHref = buildQueryString()
    ? `${pdfUrl}?${buildQueryString()}`
    : pdfUrl;

  const btnClass = "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50";

  return (
    <div className="flex items-center gap-2">
      <a
        href={pdfHref}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        PDF Export
      </a>

      <button
        onClick={handleCsvExport}
        disabled={isPending}
        className={btnClass}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {isPending ? "Exporteren..." : "CSV Export"}
      </button>
    </div>
  );
}
