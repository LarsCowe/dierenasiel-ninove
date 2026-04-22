import { db } from "@/lib/db";
import { veterinaryDiagnoses } from "@/lib/db/schema";

/**
 * Story 10.10: initiële seed van de diagnoselijst voor bezoekrapporten.
 * Idempotent: `onConflictDoNothing` op `name` unique constraint zorgt dat
 * het script meermaals gedraaid kan worden zonder duplicates.
 */
const INITIAL_DIAGNOSES = [
  "Oorontsteking",
  "Parasieten (vlooien/teken)",
  "Snijwonde",
  "Mank lopen",
  "Tandproblemen",
  "Huidirritatie / hotspot",
  "Oogontsteking",
  "Diarree",
  "Braken",
  "Urineweginfectie",
  "Schurft",
  "Wondinfectie",
  "Luchtwegklachten",
  "Ondervoeding",
  "Stressgedrag",
];

export async function seedVeterinaryDiagnoses(): Promise<{ inserted: number }> {
  const result = await db
    .insert(veterinaryDiagnoses)
    .values(INITIAL_DIAGNOSES.map((name) => ({ name })))
    .onConflictDoNothing({ target: veterinaryDiagnoses.name })
    .returning({ id: veterinaryDiagnoses.id });

  return { inserted: result.length };
}
