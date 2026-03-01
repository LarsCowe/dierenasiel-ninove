import { db } from "@/lib/db";
import { strayCatCampaigns, animals } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getCampaignById(id: number) {
  const rows = await db
    .select()
    .from(strayCatCampaigns)
    .where(eq(strayCatCampaigns.id, id));
  return rows[0] ?? null;
}

export async function getAllCampaigns() {
  return db
    .select()
    .from(strayCatCampaigns)
    .orderBy(desc(strayCatCampaigns.requestDate));
}

export async function getCatsAvailableForLinking() {
  return db
    .select({ id: animals.id, name: animals.name })
    .from(animals)
    .where(
      and(
        eq(animals.species, "kat"),
        eq(animals.isInShelter, true),
      ),
    );
}
