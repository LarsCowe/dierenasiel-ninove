import { db } from "@/lib/db";
import { animals } from "@/lib/db/schema";
import { eq, and, ne, desc } from "drizzle-orm";

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
