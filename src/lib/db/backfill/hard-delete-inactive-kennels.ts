import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "@/lib/db";
import { animals, kennels } from "@/lib/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

/**
 * One-off opruiming: alle gedeactiveerde kennels (isActive=false) worden
 * permanent verwijderd. animals.kennel_id heeft onDelete: "set null", dus
 * eventuele lopende referenties worden door Postgres zelf opgeschoond.
 *
 * Run: npm run db:cleanup-inactive-kennels
 */
async function cleanup() {
  const inactive = await db.select().from(kennels).where(eq(kennels.isActive, false));

  if (inactive.length === 0) {
    console.log("✓ Geen inactieve kennels gevonden — niets te doen.");
    process.exit(0);
  }

  console.log(`Gevonden ${inactive.length} inactieve kennel(s): ${inactive.map((k) => k.code).join(", ")}`);

  // Tel hoeveel dieren nog naar deze inactieve kennels verwijzen.
  const ids = inactive.map((k) => k.id);
  const [refCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(animals)
    .where(inArray(animals.kennelId, ids));
  if (refCount && refCount.count > 0) {
    console.log(`  → ${refCount.count} dier(en) verwijzen nog naar deze kennels (worden via FK op NULL gezet).`);
  }

  // Hard delete.
  const deleted = await db
    .delete(kennels)
    .where(eq(kennels.isActive, false))
    .returning({ id: kennels.id, code: kennels.code });

  console.log(`✓ ${deleted.length} kennel(s) hard verwijderd: ${deleted.map((k) => k.code).join(", ")}`);
  process.exit(0);
}

cleanup().catch((err) => {
  console.error(err);
  process.exit(1);
});
