export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { animals, newsArticles } from "@/lib/db/schema";
import { eq, ne } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Static pages
  const staticPages = [
    "",
    "/over-ons",
    "/honden-ter-adoptie",
    "/katten-ter-adoptie",
    "/andere-dieren",
    "/nieuws",
    "/contact",
    "/wandelreglement",
    "/een-dier-afstaan",
    "/vrijwilligerswerk",
    "/steun-ons",
    "/kennelsponsor",
    "/eetfestijn",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  // Dynamic animal pages
  const allAnimals = await db
    .select({ slug: animals.slug, species: animals.species, updatedAt: animals.updatedAt })
    .from(animals)
    .where(ne(animals.status, "geadopteerd"));

  const animalPages = allAnimals.map((a) => {
    const prefix =
      a.species === "hond"
        ? "/honden-ter-adoptie"
        : a.species === "kat"
        ? "/katten-ter-adoptie"
        : "/andere-dieren";
    return {
      url: `${baseUrl}${prefix}/${a.slug}`,
      lastModified: a.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    };
  });

  // Dynamic news pages
  const allNews = await db
    .select({ slug: newsArticles.slug, updatedAt: newsArticles.updatedAt })
    .from(newsArticles)
    .where(eq(newsArticles.isPublished, true));

  const newsPages = allNews.map((n) => ({
    url: `${baseUrl}/nieuws/${n.slug}`,
    lastModified: n.updatedAt || new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...animalPages, ...newsPages];
}
