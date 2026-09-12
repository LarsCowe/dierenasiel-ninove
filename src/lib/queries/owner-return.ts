import { db } from "@/lib/db";
import { ownerReturnForms } from "@/lib/db/schema";
import { and, desc, eq, sql, type InferSelectModel } from "drizzle-orm";
import { OWNER_RETURN_NR_PREFIX } from "@/lib/animals/owner-return";

export type OwnerReturnFormRow = InferSelectModel<typeof ownerReturnForms>;

/** Story 10.64 — de formulieren "Terug naar eigenaar" van één dier, nieuwste eerst. */
export async function getOwnerReturnFormsByAnimalId(animalId: number): Promise<OwnerReturnFormRow[]> {
  try {
    return await db
      .select()
      .from(ownerReturnForms)
      .where(eq(ownerReturnForms.animalId, animalId))
      .orderBy(desc(ownerReturnForms.createdAt), desc(ownerReturnForms.id));
  } catch (err) {
    console.error("getOwnerReturnFormsByAnimalId failed:", err);
    return [];
  }
}

/** Eén formulier, enkel als het bij dat dier hoort (de URL draagt beide). */
export async function getOwnerReturnForm(animalId: number, formId: number): Promise<OwnerReturnFormRow | null> {
  try {
    const [rij] = await db
      .select()
      .from(ownerReturnForms)
      .where(and(eq(ownerReturnForms.id, formId), eq(ownerReturnForms.animalId, animalId)))
      .limit(1);
    return rij ?? null;
  } catch (err) {
    console.error("getOwnerReturnForm failed:", err);
    return null;
  }
}

/** Het hoogste volgnummer van een jaar, of null als er nog geen is. */
export async function getLastOwnerReturnNr(jaar: number): Promise<string | null> {
  const [rij] = await db
    .select({ formNr: ownerReturnForms.formNr })
    .from(ownerReturnForms)
    .where(sql`${ownerReturnForms.formNr} like ${`${OWNER_RETURN_NR_PREFIX}-${jaar}-%`}`)
    // Op lengte én tekst sorteren: "10000" komt anders vóór "9999".
    .orderBy(desc(sql`length(${ownerReturnForms.formNr})`), desc(ownerReturnForms.formNr))
    .limit(1);
  return rij?.formNr ?? null;
}
