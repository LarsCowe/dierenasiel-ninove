import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";
import { dogSeeds, catSeeds, otherAnimalSeeds } from "./animals";
import { newsSeeds } from "./news";
import { pageSeeds } from "./pages";
import { sponsorSeeds } from "./sponsors";
import { kennelSeeds } from "./kennels";
import { getUserSeeds } from "./users";

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log("Seeding database...");

  // Clear existing data (order matters — FK constraints)
  console.log("Clearing existing data...");
  await db.delete(schema.animalAttachments);
  await db.delete(schema.contactSubmissions);
  await db.delete(schema.animals);
  await db.delete(schema.kennels);
  await db.delete(schema.newsArticles);
  await db.delete(schema.pages);
  await db.delete(schema.kennelSponsors);
  await db.delete(schema.users);

  // Seed kennels (before animals — FK dependency)
  console.log("Seeding kennels...");
  for (const kennel of kennelSeeds) {
    await db.insert(schema.kennels).values(kennel);
  }
  console.log(`  Inserted ${kennelSeeds.length} kennels`);

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

  // Seed users
  console.log("Seeding users...");
  const userSeeds = await getUserSeeds();
  for (const user of userSeeds) {
    await db.insert(schema.users).values(user);
  }
  console.log(`  Inserted ${userSeeds.length} users`);

  // Seed shelter settings
  console.log("Seeding shelter settings...");
  await db.delete(schema.shelterSettings);
  await db.insert(schema.shelterSettings).values({
    key: "walking_club_threshold",
    value: "10",
  });
  console.log("  Inserted shelter settings");

  console.log("Seeding complete!");
}

seed().catch(console.error);
