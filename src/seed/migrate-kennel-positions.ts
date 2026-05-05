/**
 * Story 10.19: eenmalige migratie van hardcoded KENNEL_POSITIONS naar DB.
 *
 * Voor elke kennel met code in KENNEL_POSITIONS waar pos_x NULL is, kopieer
 * de waarden uit de constants. Idempotent — kan veilig opnieuw gedraaid worden;
 * bestaande niet-NULL posities worden NIET overschreven.
 *
 * Run: npm run db:migrate-positions
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { kennels } from "@/lib/db/schema";
import { KENNEL_POSITIONS } from "@/lib/constants/kennel-positions";

async function migrateKennelPositions() {
  let updated = 0;
  let skipped = 0;
  let missing = 0;

  for (const pos of KENNEL_POSITIONS) {
    const result = await db
      .update(kennels)
      .set({
        posX: String(pos.x),
        posY: String(pos.y),
        posW: String(pos.w),
        posH: String(pos.h),
      })
      .where(and(eq(kennels.code, pos.code), isNull(kennels.posX)))
      .returning({ id: kennels.id });

    if (result.length > 0) {
      updated++;
      console.log(`  ✓ ${pos.code}: positie ingesteld`);
    } else {
      const existing = await db.select().from(kennels).where(eq(kennels.code, pos.code));
      if (existing.length === 0) {
        missing++;
        console.log(`  ✗ ${pos.code}: kennel niet in DB`);
      } else {
        skipped++;
      }
    }
  }

  console.log(
    `\nKlaar: ${updated} bijgewerkt, ${skipped} overgeslagen (had al positie), ${missing} ontbrekend.`,
  );
}

migrateKennelPositions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
