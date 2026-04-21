import { db } from "@/lib/db";
import { animals } from "@/lib/db/schema";
import { and, eq, isNull, isNotNull, sql } from "drizzle-orm";
import { fileURLToPath } from "node:url";

/**
 * Backfill: dieren die vóór de fix in Story 10.1 via `registerOuttake`
 * met reden "adoptie" zijn geregistreerd hebben `adoptedDate = NULL`,
 * waardoor ze niet verschijnen in dashboard "Recente Adopties".
 *
 * Idempotent: alleen rijen met ontbrekende `adoptedDate` én aanwezige
 * `outtakeDate` + `outtakeReason='adoptie'` worden aangeraakt.
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

// Direct uitvoerbaar via: npx tsx src/lib/db/backfill/backfill-adopted-date.ts
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  backfillAdoptedDate()
    .then(({ updatedCount }) => {
      // eslint-disable-next-line no-console
      console.log(`✓ Backfill voltooid: ${updatedCount} dier(en) geüpdatet.`);
      process.exit(0);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("✗ Backfill gefaald:", err);
      process.exit(1);
    });
}
