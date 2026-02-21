import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";
import { dogSeeds, catSeeds, otherAnimalSeeds } from "./animals";
import { newsSeeds } from "./news";
import { pageSeeds } from "./pages";
import { sponsorSeeds } from "./sponsors";

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log("Seeding database...");

  // Clear existing data
  console.log("Clearing existing data...");
  await db.delete(schema.contactSubmissions);
  await db.delete(schema.animals);
  await db.delete(schema.newsArticles);
  await db.delete(schema.pages);
  await db.delete(schema.kennelSponsors);

  // Seed animals
  console.log("Seeding animals...");
  const allAnimals = [...dogSeeds, ...catSeeds, ...otherAnimalSeeds];
  for (const animal of allAnimals) {
    await db.insert(schema.animals).values(animal);
  }
  console.log(`  Inserted ${allAnimals.length} animals`);

  // Seed news
  console.log("Seeding news articles...");
  for (const article of newsSeeds) {
    await db.insert(schema.newsArticles).values(article);
  }
  console.log(`  Inserted ${newsSeeds.length} news articles`);

  // Seed pages
  console.log("Seeding pages...");
  for (const page of pageSeeds) {
    await db.insert(schema.pages).values(page);
  }
  console.log(`  Inserted ${pageSeeds.length} pages`);

  // Seed sponsors
  console.log("Seeding sponsors...");
  for (const sponsor of sponsorSeeds) {
    await db.insert(schema.kennelSponsors).values(sponsor);
  }
  console.log(`  Inserted ${sponsorSeeds.length} sponsors`);

  console.log("Seeding complete!");
}

seed().catch(console.error);
