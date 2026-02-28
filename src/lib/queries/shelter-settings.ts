import { db } from "@/lib/db";
import { shelterSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_WALKING_CLUB_THRESHOLD = 10;

export async function getWalkingClubThreshold(): Promise<number> {
  try {
    const results = await db
      .select()
      .from(shelterSettings)
      .where(eq(shelterSettings.key, "walking_club_threshold"))
      .limit(1);

    if (results.length === 0) return DEFAULT_WALKING_CLUB_THRESHOLD;

    const parsed = parseInt(results[0].value, 10);
    return isNaN(parsed) ? DEFAULT_WALKING_CLUB_THRESHOLD : parsed;
  } catch (err) {
    console.error("getWalkingClubThreshold query failed:", err);
    return DEFAULT_WALKING_CLUB_THRESHOLD;
  }
}
