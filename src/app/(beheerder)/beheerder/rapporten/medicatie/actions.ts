"use server";

import { exportMedicationReportCsv } from "@/lib/actions/report-export";

export async function exportMedicationReportCsvWrapper(
  filters: Record<string, string>,
): Promise<{ success: true; data: string } | { success: false; error?: string }> {
  const isActive = filters.status === "actief" ? true : filters.status === "afgerond" ? false : undefined;
  return exportMedicationReportCsv({ isActive });
}
