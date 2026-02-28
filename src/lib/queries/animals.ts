import { db } from "@/lib/db";
import { animals } from "@/lib/db/schema";
import { eq, and, ne, desc, asc, or, ilike, sql, isNotNull } from "drizzle-orm";
import type { Animal } from "@/types";

export interface AdminAnimalListOptions {
  search?: string;
  species?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface AdminAnimalListResult {
  animals: Animal[];
  total: number;
}

export async function getAnimals(options?: {
  species?: string;
  status?: string;
}) {
  const conditions = [];
  if (options?.species) {
    conditions.push(eq(animals.species, options.species));
  }
  if (options?.status) {
    conditions.push(eq(animals.status, options.status));
  }
  // Don't show adopted animals by default
  conditions.push(ne(animals.status, "geadopteerd"));

  return db
    .select()
    .from(animals)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(animals.createdAt));
}

export async function getAnimalById(id: number): Promise<Animal | null> {
  try {
    const results = await db
      .select()
      .from(animals)
      .where(eq(animals.id, id))
      .limit(1);
    return (results[0] as Animal) ?? null;
  } catch (err) {
    console.error("getAnimalById query failed:", err);
    return null;
  }
}

export async function getAnimalBySlug(slug: string) {
  const results = await db
    .select()
    .from(animals)
    .where(eq(animals.slug, slug))
    .limit(1);
  return results[0] || null;
}

export async function getFeaturedAnimals() {
  return db
    .select()
    .from(animals)
    .where(
      and(eq(animals.isFeatured, true), ne(animals.status, "geadopteerd"))
    )
    .orderBy(desc(animals.createdAt))
    .limit(3);
}

function getSortColumn(key: string) {
  switch (key) {
    case "name": return animals.name;
    case "species": return animals.species;
    case "status": return animals.status;
    case "intakeDate": return animals.intakeDate;
    case "createdAt": return animals.createdAt;
    default: return animals.intakeDate;
  }
}

export async function getAnimalsForAdmin(
  options: AdminAnimalListOptions = {},
): Promise<AdminAnimalListResult> {
  const {
    search,
    species,
    status,
    page = 1,
    pageSize = 25,
    sortBy,
    sortDir = "desc",
  } = options;

  const conditions = [];
  if (species) conditions.push(eq(animals.species, species));
  if (status) conditions.push(eq(animals.status, status));
  if (search) {
    const escaped = search.replace(/[%_]/g, "\\$&");
    conditions.push(
      or(
        ilike(animals.name, `%${escaped}%`),
        ilike(animals.identificationNr, `%${escaped}%`),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const sortColumn = getSortColumn(sortBy ?? "");
  const orderFn = sortDir === "asc" ? asc : desc;

  try {
    const [results, totalResult] = await Promise.all([
      db
        .select()
        .from(animals)
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(animals)
        .where(whereClause),
    ]);

    return {
      animals: results as Animal[],
      total: (totalResult as { count: number }[])[0]?.count ?? 0,
    };
  } catch (err) {
    console.error("getAnimalsForAdmin query failed:", err);
    return { animals: [], total: 0 };
  }
}

/**
 * Returns animals available for adoption (FR-07).
 * Only shows animals that are marked as available AND still in the shelter.
 */
export async function getAnimalsAvailableForAdoption(): Promise<Animal[]> {
  try {
    const results = await db
      .select()
      .from(animals)
      .where(
        and(
          eq(animals.isAvailableForAdoption, true),
          eq(animals.isInShelter, true),
        ),
      )
      .orderBy(asc(animals.name));
    return results as Animal[];
  } catch (err) {
    console.error("getAnimalsAvailableForAdoption query failed:", err);
    return [];
  }
}

/**
 * Returns animals with an IBN deadline within the next 7 days.
 * Used for the dashboard deadline widget (FR-06).
 */
export async function getIbnDeadlineAlerts(): Promise<Animal[]> {
  try {
    const results = await db
      .select()
      .from(animals)
      .where(
        and(
          isNotNull(animals.ibnDecisionDeadline),
          eq(animals.isInShelter, true),
          sql`${animals.ibnDecisionDeadline} <= CURRENT_DATE + INTERVAL '7 days'`,
        ),
      )
      .orderBy(asc(animals.ibnDecisionDeadline));
    return results as Animal[];
  } catch (err) {
    console.error("getIbnDeadlineAlerts query failed:", err);
    return [];
  }
}
