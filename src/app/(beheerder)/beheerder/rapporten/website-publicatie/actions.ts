"use server";

import { exportWebsitePublicationCsv } from "@/lib/actions/report-export";

export async function exportWebsitePublicationCsvWrapper(): Promise<
  { success: true; data: string } | { success: false; error?: string }
> {
  return exportWebsitePublicationCsv();
}
