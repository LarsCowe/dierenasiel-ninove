"use server";

import { db } from "@/lib/db";
import { feedingPlans, animals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { feedingPlanSchema } from "@/lib/validations/feeding-plans";
import { revalidatePath } from "next/cache";
import type { ActionResult, FeedingPlan } from "@/types";

export async function upsertFeedingPlan(
  _prevState: ActionResult<FeedingPlan> | null,
  formData: FormData,
): Promise<ActionResult<FeedingPlan>> {
  const permCheck = await requirePermission("animal:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const questionnaireRaw = formData.get("questionnaire") as string | null;
  let questionnaire: unknown;
  if (questionnaireRaw) {
    try {
      questionnaire = JSON.parse(questionnaireRaw);
    } catch {
      return {
        success: false,
        fieldErrors: { questionnaire: ["Ongeldige vragenlijst data"] },
      };
    }
  }

  const raw = {
    animalId: formData.get("animalId"),
    questionnaire,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = feedingPlanSchema.safeParse(raw);
  if (!parsed.success) {
    // Extract nested questionnaire errors to top-level field keys
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { success: false, fieldErrors };
  }

  try {
    // Verify animal exists
    const [animal] = await db
      .select({ id: animals.id })
      .from(animals)
      .where(eq(animals.id, parsed.data.animalId))
      .limit(1);
    if (!animal) {
      return { success: false, error: "Dier niet gevonden" };
    }

    // Fetch existing plan for audit trail
    const [existingPlan] = await db
      .select()
      .from(feedingPlans)
      .where(eq(feedingPlans.animalId, parsed.data.animalId))
      .limit(1);

    const [plan] = await db
      .insert(feedingPlans)
      .values({
        animalId: parsed.data.animalId,
        questionnaire: parsed.data.questionnaire,
        notes: parsed.data.notes || null,
      })
      .onConflictDoUpdate({
        target: feedingPlans.animalId,
        set: {
          questionnaire: parsed.data.questionnaire,
          notes: parsed.data.notes || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    const action = existingPlan ? "update_feeding_plan" : "create_feeding_plan";
    await logAudit(action, "feeding_plan", plan.id, existingPlan ?? null, plan);
    revalidatePath("/beheerder/dieren");

    return { success: true, data: plan };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het opslaan. Probeer het later opnieuw.",
    };
  }
}
