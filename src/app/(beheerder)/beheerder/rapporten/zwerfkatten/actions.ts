"use server";

import { exportStrayCatCampaignsCsv } from "@/lib/actions/report-export";

export async function exportStrayCatCsvWrapper(
  filters: Record<string, string>,
): Promise<{ success: true; data: string } | { success: false; error?: string }> {
  return exportStrayCatCampaignsCsv({
    municipality: filters.gemeente || undefined,
    dateFrom: filters.van || undefined,
    dateTo: filters.tot || undefined,
  });
}
