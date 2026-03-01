"use server";

import { exportWalkActivityCsv } from "@/lib/actions/report-export";

export async function exportWalkActivityCsvWrapper(
  filters: Record<string, string>,
): Promise<{ success: true; data: string } | { success: false; error?: string }> {
  return exportWalkActivityCsv({
    dateFrom: filters.van || undefined,
    dateTo: filters.tot || undefined,
    walkerId: filters.wandelaar ? parseInt(filters.wandelaar, 10) || undefined : undefined,
    animalId: filters.dier ? parseInt(filters.dier, 10) || undefined : undefined,
  });
}
