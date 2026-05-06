import { db } from "@/lib/db";
import { municipalityLogos } from "@/lib/db/schema";
import { eq, sql, asc, isNull } from "drizzle-orm";
import type { MunicipalityLogo } from "@/types";

// Actieve (niet soft-deleted) opdrachtgevers — voor de bibliotheek-pagina
// en dropdowns bij het aanmaken van campagnes.
export async function getMunicipalityLogos(): Promise<MunicipalityLogo[]> {
  try {
    return (await db
      .select()
      .from(municipalityLogos)
      .where(isNull(municipalityLogos.deletedAt))
      .orderBy(asc(municipalityLogos.name))) as MunicipalityLogo[];
  } catch (err) {
    console.error("getMunicipalityLogos query failed:", err);
    return [];
  }
}

// Inclusief soft-deleted: gebruikt om historische campagnes hun
// opdrachtgever-logo te laten resolven, ook na verwijdering uit de bibliotheek.
export async function getAllMunicipalityLogosIncludingDeleted(): Promise<MunicipalityLogo[]> {
  try {
    return (await db
      .select()
      .from(municipalityLogos)
      .orderBy(asc(municipalityLogos.name))) as MunicipalityLogo[];
  } catch (err) {
    console.error("getAllMunicipalityLogosIncludingDeleted query failed:", err);
    return [];
  }
}

export async function getMunicipalityLogoById(id: number): Promise<MunicipalityLogo | null> {
  try {
    const rows = await db
      .select()
      .from(municipalityLogos)
      .where(eq(municipalityLogos.id, id))
      .limit(1);
    return (rows[0] as MunicipalityLogo) ?? null;
  } catch (err) {
    console.error("getMunicipalityLogoById query failed:", err);
    return null;
  }
}

export async function getMunicipalityLogoByName(name: string): Promise<MunicipalityLogo | null> {
  try {
    const rows = await db
      .select()
      .from(municipalityLogos)
      .where(sql`lower(${municipalityLogos.name}) = lower(${name})`)
      .limit(1);
    return (rows[0] as MunicipalityLogo) ?? null;
  } catch (err) {
    console.error("getMunicipalityLogoByName query failed:", err);
    return null;
  }
}
