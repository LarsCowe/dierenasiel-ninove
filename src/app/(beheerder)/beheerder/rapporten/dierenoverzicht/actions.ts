"use server";

import { exportAnimalReportCsv } from "@/lib/actions/report-export";

export async function exportAnimalReportCsvWrapper(
  filters: Record<string, string>,
): Promise<{ success: true; data: string } | { success: false; error?: string }> {
  const mappedFilters = {
    species: filters.soort || undefined,
    status: filters.status || undefined,
    kennelId: filters.kennel ? parseInt(filters.kennel, 10) : undefined,
    workflowPhase: filters.fase || undefined,
  };
  return exportAnimalReportCsv(mappedFilters);
}
