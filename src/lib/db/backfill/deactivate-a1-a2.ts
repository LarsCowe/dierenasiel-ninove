import { db } from "@/lib/db";
import { animals, kennels } from "@/lib/db/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";

/**
 * Story 10.12 opruiming: bovenaan het grondplan zijn slechts 2 kennels
 * (A3 + A4) nodig. A1 en A2 worden gedeactiveerd. Dieren die er via de
 * demo-backfill waren toegewezen worden verplaatst naar A3/A4.
 */
async function deactivate() {
  const aKennels = await db
    .select()
    .from(kennels)
    .where(and(eq(kennels.zone, "andere"), inArray(kennels.code, ["A1", "A2", "A3", "A4"])));
  const byCode = new Map(aKennels.map((k) => [k.code, k]));

  const a1 = byCode.get("A1");
  const a2 = byCode.get("A2");
  const a3 = byCode.get("A3");
  const a4 = byCode.get("A4");
  if (!a1 || !a2 || !a3 || !a4) throw new Error("Missing A1-A4 kennels");

  // Verplaats dieren uit A1 → A3, uit A2 → A4
  const a3Moved = await db
    .update(animals)
    .set({ kennelId: a3.id })
    .where(eq(animals.kennelId, a1.id))
    .returning({ id: animals.id, name: animals.name });
  const a4Moved = await db
    .update(animals)
    .set({ kennelId: a4.id })
    .where(eq(animals.kennelId, a2.id))
    .returning({ id: animals.id, name: animals.name });

  // Deactiveer A1 + A2
  await db
    .update(kennels)
    .set({ isActive: false })
    .where(inArray(kennels.code, ["A1", "A2"]));

  console.log(`✓ Dieren verplaatst A1→A3: ${a3Moved.map((a) => a.name).join(", ") || "(geen)"}`);
  console.log(`✓ Dieren verplaatst A2→A4: ${a4Moved.map((a) => a.name).join(", ") || "(geen)"}`);
  console.log(`✓ A1 en A2 gedeactiveerd.`);
  void isNull;
  process.exit(0);
}

deactivate().catch((err) => {
  console.error(err);
  process.exit(1);
});
