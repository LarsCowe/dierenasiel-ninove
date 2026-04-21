import { db } from "@/lib/db";
import { animals } from "@/lib/db/schema";
import { and, eq, isNull, isNotNull, sql } from "drizzle-orm";

/**
 * Backfill: dieren die vóór de fix in Story 10.1 via `registerOuttake`
 * met reden "adoptie" zijn geregistreerd hebben `adoptedDate = NULL`,
 * waardoor ze niet verschijnen in dashboard "Recente Adopties".
 *
 * Idempotent: alleen rijen met ontbrekende `adoptedDate` én aanwezige
 * `outtakeDate` + `outtakeReason='adoptie'` worden aangeraakt.
 *
 * Uitvoeren via: `npx tsx --env-file=.env.local src/lib/db/backfill/run-backfill-adopted-date.ts`
 */
export async function backfillAdoptedDate(): Promise<{ updatedCount: number }> {
  const result = await db
    .update(animals)
    .set({ adoptedDate: sql`${animals.outtakeDate}` })
    .where(
      and(
        eq(animals.status, "geadopteerd"),
        eq(animals.outtakeReason, "adoptie"),
        isNull(animals.adoptedDate),
        isNotNull(animals.outtakeDate),
      ),
    )
    .returning({ id: animals.id });

  return { updatedCount: result.length };
}
