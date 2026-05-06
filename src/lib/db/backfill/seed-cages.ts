import { db } from "@/lib/db";
import { cages } from "@/lib/db/schema";

/**
 * Initiële seed van de kooi-bibliotheek (K1..K20). Vervangt de hardcoded
 * CAGE_NUMBERS-constant. Idempotent: `onConflictDoNothing` op de unique
 * `code`-constraint zorgt dat het script meermaals gedraaid kan worden
 * zonder duplicates of verstoring van bestaande kooien.
 */
const INITIAL_CAGE_CODES = Array.from({ length: 20 }, (_, i) => `K${i + 1}`);

export async function seedCages(): Promise<{ inserted: number }> {
  const result = await db
    .insert(cages)
    .values(INITIAL_CAGE_CODES.map((code) => ({ code })))
    .onConflictDoNothing({ target: cages.code })
    .returning({ id: cages.id });

  return { inserted: result.length };
}
