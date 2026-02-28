"use server";

import { getSession } from "@/lib/auth/session";
import { getWalkHistoryByWalkerId, getWalkHistoryByAnimalId } from "@/lib/queries/walks";
import type { ActionResult } from "@/types";
import type { WalkHistoryEntry } from "@/types";

interface ExportFilters {
  walkerId?: number;
  animalId?: number;
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function walkToCsvRow(entry: WalkHistoryEntry): string {
  return [
    entry.date,
    escapeCsvField(`${entry.walkerFirstName} ${entry.walkerLastName}`),
    escapeCsvField(entry.animalName),
    entry.startTime,
    entry.endTime ?? "",
    entry.durationMinutes?.toString() ?? "",
    escapeCsvField(entry.remarks ?? ""),
    entry.status,
  ].join(",");
}

export async function exportWalksCsv(filters: ExportFilters): Promise<ActionResult<string>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Je bent niet ingelogd." };
  }

  if (session.role !== "beheerder") {
    return { success: false, error: "Alleen beheerders kunnen exports maken." };
  }

  if (!filters.walkerId && !filters.animalId) {
    return { success: false, error: "Selecteer een wandelaar of dier om te exporteren." };
  }

  const entries: WalkHistoryEntry[] = filters.walkerId
    ? await getWalkHistoryByWalkerId(filters.walkerId)
    : await getWalkHistoryByAnimalId(filters.animalId!);

  const header = "Datum,Wandelaar,Hond,Start,Einde,Duur (min),Opmerkingen,Status";
  const rows = entries.map(walkToCsvRow);
  const csv = [header, ...rows].join("\n");

  return { success: true, data: csv };
}
