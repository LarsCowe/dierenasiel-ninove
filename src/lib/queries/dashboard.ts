import { db } from "@/lib/db";
import { animals, contactSubmissions, users } from "@/lib/db/schema";
import { eq, sql, desc, isNotNull } from "drizzle-orm";

export interface DashboardStats {
  animalsBySpecies: { species: string; count: number }[];
  animalsByStatus: { status: string; count: number }[];
  recentAdoptions: { id: number; name: string; species: string; adoptedDate: string | null }[];
  unreadMessages: number;
  activeUsers: number;
  totalAnimals: number;
}

const EMPTY_STATS: DashboardStats = {
  animalsBySpecies: [],
  animalsByStatus: [],
  recentAdoptions: [],
  unreadMessages: 0,
  activeUsers: 0,
  totalAnimals: 0,
};

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [
      animalsBySpecies,
      animalsByStatus,
      recentAdoptions,
      unreadMessagesResult,
      activeUsersResult,
      totalAnimalsResult,
    ] = await Promise.all([
      db
        .select({ species: animals.species, count: sql<number>`count(*)::int` })
        .from(animals)
        .groupBy(animals.species),

      // Story 10.5: splits "beschikbaar" in twee buckets — dieren die publiek
      // beschikbaar zijn voor adoptie vs. dieren die in asiel zijn maar nog niet
      // ter adoptie (bv. medische check lopend, quarantaine, gedragsevaluatie).
      (() => {
        const statusBucket = sql<string>`CASE
          WHEN ${animals.status} = 'beschikbaar' AND ${animals.isAvailableForAdoption} = false
            THEN 'niet_ter_adoptie'
          ELSE ${animals.status}
        END`;
        return db
          .select({ status: statusBucket, count: sql<number>`count(*)::int` })
          .from(animals)
          .groupBy(statusBucket);
      })(),

      db
        .select({
          id: animals.id,
          name: animals.name,
          species: animals.species,
          adoptedDate: animals.adoptedDate,
        })
        .from(animals)
        .where(isNotNull(animals.adoptedDate))
        .orderBy(desc(animals.adoptedDate))
        .limit(5),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(contactSubmissions)
        .where(eq(contactSubmissions.isRead, false)),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.isActive, true)),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(animals),
    ]);

    return {
      animalsBySpecies: animalsBySpecies as { species: string; count: number }[],
      animalsByStatus: animalsByStatus as { status: string; count: number }[],
      recentAdoptions: recentAdoptions as { id: number; name: string; species: string; adoptedDate: string | null }[],
      unreadMessages: (unreadMessagesResult as { count: number }[])[0]?.count ?? 0,
      activeUsers: (activeUsersResult as { count: number }[])[0]?.count ?? 0,
      totalAnimals: (totalAnimalsResult as { count: number }[])[0]?.count ?? 0,
    };
  } catch {
    return EMPTY_STATS;
  }
}
