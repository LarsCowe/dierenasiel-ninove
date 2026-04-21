import { db } from "@/lib/db";
import { strayCatCampaigns } from "@/lib/db/schema";
import { eq, isNotNull } from "drizzle-orm";

/**
 * Backfill: normaliseert cageNumbers van oude campagnes naar het K-prefix formaat
 * dat Story 10.7 hanteert. Pre-fix data bevatte soms raw nummers ("15", "16")
 * waardoor de nieuwe kooi-picker ze niet herkende als "bezet".
 *
 * Transformaties:
 *   "15"        → "K15"
 *   "15, 16"    → "K15,K16"
 *   "K1,K2"     → "K1,K2" (ongewijzigd)
 *   "K1, 5"     → "K1,K5" (gemengd, beide genormaliseerd)
 *
 * Idempotent: reeds correct gevormde waarden blijven ongewijzigd.
 */

function normalizeCageNumber(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^K\d+$/i.test(trimmed)) return trimmed.toUpperCase();
  if (/^\d+$/.test(trimmed)) return `K${trimmed}`;
  return trimmed; // onbekend formaat, laat staan
}

export function normalizeCageNumbersString(input: string | null): string | null {
  if (!input) return input;
  return input
    .split(",")
    .map(normalizeCageNumber)
    .filter(Boolean)
    .join(",");
}

export async function backfillCageNumbersPrefix(): Promise<{ scanned: number; updated: number }> {
  const rows = await db
    .select({ id: strayCatCampaigns.id, cageNumbers: strayCatCampaigns.cageNumbers })
    .from(strayCatCampaigns)
    .where(isNotNull(strayCatCampaigns.cageNumbers));

  let updated = 0;
  for (const row of rows) {
    const normalized = normalizeCageNumbersString(row.cageNumbers);
    if (normalized && normalized !== row.cageNumbers) {
      await db
        .update(strayCatCampaigns)
        .set({ cageNumbers: normalized })
        .where(eq(strayCatCampaigns.id, row.id));
      updated++;
    }
  }

  return { scanned: rows.length, updated };
}
