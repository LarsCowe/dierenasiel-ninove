import { db } from "@/lib/db";
import { blacklistEntries } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { BlacklistEntry } from "@/types";

export async function getAllBlacklistEntries(): Promise<BlacklistEntry[]> {
  return db
    .select()
    .from(blacklistEntries)
    .orderBy(desc(blacklistEntries.createdAt));
}

export async function getActiveBlacklistEntries(): Promise<BlacklistEntry[]> {
  return db
    .select()
    .from(blacklistEntries)
    .where(eq(blacklistEntries.isActive, true))
    .orderBy(desc(blacklistEntries.createdAt));
}

export async function checkBlacklistMatch(
  firstName: string,
  lastName: string,
  address: string | null,
): Promise<BlacklistEntry | null> {
  const entries = await getActiveBlacklistEntries();

  const normFirst = firstName.trim().toLowerCase();
  const normLast = lastName.trim().toLowerCase();
  const normAddress = address?.trim().toLowerCase() || null;

  for (const entry of entries) {
    const entryFirst = entry.firstName.trim().toLowerCase();
    const entryLast = entry.lastName.trim().toLowerCase();

    // Name match
    if (entryFirst === normFirst && entryLast === normLast) {
      return entry;
    }

    // Address match (only if both have an address)
    if (normAddress && entry.address) {
      const entryAddress = entry.address.trim().toLowerCase();
      if (entryAddress === normAddress) {
        return entry;
      }
    }
  }

  return null;
}
