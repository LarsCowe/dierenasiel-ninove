"use server";

import { exportWorkflowOverviewCsv } from "@/lib/actions/report-export";

export async function exportWorkflowOverviewCsvWrapper(
  filters: Record<string, string>,
): Promise<{ success: true; data: string } | { success: false; error?: string }> {
  return exportWorkflowOverviewCsv({
    species: filters.soort || undefined,
    workflowPhase: filters.fase || undefined,
    dateFrom: filters.van || undefined,
    dateTo: filters.tot || undefined,
  });
}
