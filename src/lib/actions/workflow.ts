"use server";

import { db } from "@/lib/db";
import { animals, animalWorkflowHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { getWorkflowSettings } from "@/lib/queries/shelter-settings";
import { WORKFLOW_PHASES, getNextPhase } from "@/lib/workflow/phases";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { WorkflowPhase } from "@/lib/workflow/phases";

export async function transitionAnimalPhase(
  animalId: number,
  reason?: string,
): Promise<ActionResult<{ fromPhase: string; toPhase: string }>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Je bent niet ingelogd." };
  }

  if (!hasPermission(session.role, "workflow:write")) {
    return { success: false, error: "Je hebt niet de juiste rechten." };
  }

  const settings = await getWorkflowSettings();
  if (!settings.workflowEnabled) {
    return { success: false, error: "Workflow-functionaliteit is niet beschikbaar." };
  }

  try {
    const animalResults = await db
      .select({ id: animals.id, workflowPhase: animals.workflowPhase })
      .from(animals)
      .where(eq(animals.id, animalId))
      .limit(1);

    if (animalResults.length === 0) {
      return { success: false, error: "Dier niet gevonden." };
    }

    const animal = animalResults[0];
    const currentPhase = animal.workflowPhase;

    if (!currentPhase) {
      return { success: false, error: "Dit dier heeft geen workflow-fase toegewezen." };
    }

    if (!WORKFLOW_PHASES.includes(currentPhase as WorkflowPhase)) {
      return { success: false, error: `Ongeldige workflow-fase: "${currentPhase}".` };
    }

    const nextPhase = getNextPhase(currentPhase as WorkflowPhase);

    if (!nextPhase) {
      return { success: false, error: "Dit dier heeft het traject voltooid — geen verdere fasen beschikbaar." };
    }

    await db
      .update(animals)
      .set({ workflowPhase: nextPhase })
      .where(eq(animals.id, animalId));

    // History insert is non-critical: neon-http driver has no transaction support,
    // so if this fails the phase update already succeeded. Log error but don't fail.
    try {
      await db.insert(animalWorkflowHistory).values({
        animalId,
        fromPhase: currentPhase,
        toPhase: nextPhase,
        changedBy: session.userId,
        changeReason: reason ?? null,
      });
    } catch (historyErr) {
      console.error("Workflow history insert failed (phase was updated):", historyErr);
    }

    await logAudit(
      "animal.workflow_phase_changed",
      "animal",
      animalId,
      { workflowPhase: currentPhase },
      { workflowPhase: nextPhase },
    );

    revalidatePath(`/beheerder/dieren/${animalId}`);

    return { success: true, data: { fromPhase: currentPhase, toPhase: nextPhase } };
  } catch {
    return { success: false, error: "Er ging iets mis. Probeer het later opnieuw." };
  }
}
