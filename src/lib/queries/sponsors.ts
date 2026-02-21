import { db } from "@/lib/db";
import { kennelSponsors } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function getActiveSponsors() {
  return db
    .select()
    .from(kennelSponsors)
    .where(eq(kennelSponsors.isActive, true))
    .orderBy(asc(kennelSponsors.sortOrder));
}
