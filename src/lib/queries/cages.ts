import { db } from "@/lib/db";
import { cages } from "@/lib/db/schema";
import { eq, sql, asc, isNull } from "drizzle-orm";
import type { Cage } from "@/types";

// Actieve (niet soft-deleted) kooien — voor de bibliotheek-pagina en de
// kooi-uitzetting picker bij campagnes.
export async function getCages(): Promise<Cage[]> {
  try {
    return (await db
      .select()
      .from(cages)
      .where(isNull(cages.deletedAt))
      .orderBy(asc(cages.code))) as Cage[];
  } catch (err) {
    console.error("getCages query failed:", err);
    return [];
  }
}

// Inclusief soft-deleted: voor het resolven van kooi-codes in historische
// campagnes (bv. tabel-weergave of audit-trail).
export async function getAllCagesIncludingDeleted(): Promise<Cage[]> {
  try {
    return (await db
      .select()
      .from(cages)
      .orderBy(asc(cages.code))) as Cage[];
  } catch (err) {
    console.error("getAllCagesIncludingDeleted query failed:", err);
    return [];
  }
}

export async function getCageById(id: number): Promise<Cage | null> {
  try {
    const rows = await db
      .select()
      .from(cages)
      .where(eq(cages.id, id))
      .limit(1);
    return (rows[0] as Cage) ?? null;
  } catch (err) {
    console.error("getCageById query failed:", err);
    return null;
  }
}

export async function getCageByCode(code: string): Promise<Cage | null> {
  try {
    const rows = await db
      .select()
      .from(cages)
      .where(sql`lower(${cages.code}) = lower(${code})`)
      .limit(1);
    return (rows[0] as Cage) ?? null;
  } catch (err) {
    console.error("getCageByCode query failed:", err);
    return null;
  }
}
