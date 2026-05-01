import { db } from "@/lib/db";
import { animals, contactSubmissions, users, adoptionCandidates } from "@/lib/db/schema";
import { eq, sql, desc, isNotNull, and, ne, isNull, gte } from "drizzle-orm";

export interface RecentAdoptionRequest {
  animalId: number | null;
  animalName: string;
  species: string | null;
  count: number;
}

export interface DashboardStats {
  animalsBySpecies: { species: string; count: number }[];
  animalsByStatus: { status: string; count: number }[];
  recentAdoptions: { id: number; name: string; species: string; adoptedDate: string | null }[];
  unreadMessages: number;
  activeUsers: number;
  totalAnimals: number;
  recentAdoptionRequests: RecentAdoptionRequest[];
}

const EMPTY_STATS: DashboardStats = {
  animalsBySpecies: [],
  animalsByStatus: [],
  recentAdoptions: [],
  unreadMessages: 0,
  activeUsers: 0,
  totalAnimals: 0,
  recentAdoptionRequests: [],
};

export interface DashboardStatsOptions {
  /** Aantal dagen voor `recentAdoptionRequests`-aggregatie. Default 7. */
  adoptionRequestsDays?: number;
}

export async function getDashboardStats(options: DashboardStatsOptions = {}): Promise<DashboardStats> {
  const days = options.adoptionRequestsDays ?? 7;
  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      animalsBySpecies,
      animalsByStatus,
      recentAdoptions,
      unreadMessagesResult,
      activeUsersResult,
      totalAnimalsResult,
      recentAdoptionRequests,
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

      // Story 10.16: recente adoptie-aanvragen per dier (laatste 30 dagen,
      // exclusief adopted en geanonimiseerde rijen). Voor aanvragen zonder
      // animalId groeperen we op requestedAnimalName.
      db
        .select({
          animalId: adoptionCandidates.animalId,
          animalName: sql<string>`coalesce(${animals.name}, ${adoptionCandidates.requestedAnimalName}, '')`,
          species: sql<string | null>`coalesce(${animals.species}, ${adoptionCandidates.species})`,
          count: sql<number>`count(*)::int`,
          latestRequest: sql<string>`max(${adoptionCandidates.createdAt})`,
        })
        .from(adoptionCandidates)
        .leftJoin(animals, eq(adoptionCandidates.animalId, animals.id))
        .where(and(
          gte(adoptionCandidates.createdAt, cutoff),
          ne(adoptionCandidates.status, "adopted"),
          isNull(adoptionCandidates.anonymisedAt),
        ))
        .groupBy(
          adoptionCandidates.animalId,
          animals.name,
          adoptionCandidates.requestedAnimalName,
          animals.species,
          adoptionCandidates.species,
        )
        .orderBy(sql`max(${adoptionCandidates.createdAt}) desc`)
        .limit(5),
    ]);

    return {
      animalsBySpecies: animalsBySpecies as { species: string; count: number }[],
      animalsByStatus: animalsByStatus as { status: string; count: number }[],
      recentAdoptions: recentAdoptions as { id: number; name: string; species: string; adoptedDate: string | null }[],
      unreadMessages: (unreadMessagesResult as { count: number }[])[0]?.count ?? 0,
      activeUsers: (activeUsersResult as { count: number }[])[0]?.count ?? 0,
      totalAnimals: (totalAnimalsResult as { count: number }[])[0]?.count ?? 0,
      recentAdoptionRequests: (recentAdoptionRequests as Array<RecentAdoptionRequest & { latestRequest?: unknown }>).map((r) => ({
        animalId: r.animalId,
        animalName: r.animalName,
        species: r.species,
        count: r.count,
      })),
    };
  } catch {
    return EMPTY_STATS;
  }
}
