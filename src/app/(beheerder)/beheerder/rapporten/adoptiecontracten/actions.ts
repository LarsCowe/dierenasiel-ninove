"use server";

import { exportAdoptionContractsCsv } from "@/lib/actions/report-export";

export async function exportAdoptionContractsCsvWrapper(
  filters: Record<string, string>,
): Promise<{ success: true; data: string } | { success: false; error?: string }> {
  return exportAdoptionContractsCsv({
    dateFrom: filters.van || undefined,
    dateTo: filters.tot || undefined,
    paymentMethod: filters.betaalwijze || undefined,
  });
}
