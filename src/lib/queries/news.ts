import { db } from "@/lib/db";
import { newsArticles } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function getNewsArticles(limit?: number) {
  const query = db
    .select()
    .from(newsArticles)
    .where(eq(newsArticles.isPublished, true))
    .orderBy(desc(newsArticles.publishedAt));

  if (limit) {
    return query.limit(limit);
  }
  return query;
}

export async function getNewsBySlug(slug: string) {
  const results = await db
    .select()
    .from(newsArticles)
    .where(
      and(eq(newsArticles.slug, slug), eq(newsArticles.isPublished, true))
    )
    .limit(1);
  return results[0] || null;
}
