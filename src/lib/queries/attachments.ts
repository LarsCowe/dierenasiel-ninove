import { db } from "@/lib/db";
import { animalAttachments } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { AnimalAttachment } from "@/types";

export async function getAttachmentsByAnimalId(
  animalId: number,
): Promise<AnimalAttachment[]> {
  try {
    const results = await db
      .select()
      .from(animalAttachments)
      .where(eq(animalAttachments.animalId, animalId))
      .orderBy(desc(animalAttachments.uploadedAt));
    return results as AnimalAttachment[];
  } catch (err) {
    console.error("getAttachmentsByAnimalId query failed:", err);
    return [];
  }
}
