"use server";

import { db } from "@/lib/db";
import { animals, animalWorkflowHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { getWorkflowSettings } from "@/lib/queries/shelter-settings";
import { getAnimalGuardContext } from "@/lib/queries/workflow";
import { WORKFLOW_PHASES, getNextPhase } from "@/lib/workflow/phases";
import { evaluateGuards } from "@/lib/workflow/guards";
import { executeAutoActions } from "@/lib/workflow/auto-actions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { TransitionActionResult } from "@/types";
import type { WorkflowPhase } from "@/lib/workflow/phases";

export async function transitionAnimalPhase(
  animalId: number,
  reason?: string,
  overrideGuards?: boolean,
): Promise<TransitionActionResult> {
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
      .select({ id: animals.id, workflowPhase: animals.workflowPhase, intakeReason: animals.intakeReason })
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

    // Guard evaluation
    const guardContext = await getAnimalGuardContext(animalId);
    if (!guardContext) {
      return { success: false, error: "Kon guard-context niet ophalen voor dit dier." };
    }

    const warnings = evaluateGuards(currentPhase, nextPhase, guardContext);

    if (warnings.length > 0) {
      if (!overrideGuards) {
        return {
          success: false,
          error: "Er zijn waarschuwingen bij deze fase-overgang.",
          guardWarnings: warnings,
        };
      }
      if (!reason) {
        return { success: false, error: "Reden is verplicht bij het overriden van waarschuwingen." };
      }
    }

    await db
      .update(animals)
      .set({ workflowPhase: nextPhase })
      .where(eq(animals.id, animalId));

    // Auto-actions: fire-and-forget, never fail the transition
    let autoActionsTriggered: string[] | null = null;
    if (settings.autoActionsEnabled) {
      try {
        const autoActionContext = {
          animal: {
            id: guardContext.animal.id,
            species: guardContext.animal.species,
            intakeReason: animal.intakeReason ?? null,
          },
        };

        const autoResult = await executeAutoActions(animalId, nextPhase, autoActionContext, session.userId);
        if (autoResult.count > 0) {
          autoActionsTriggered = autoResult.descriptions;
        }
      } catch (autoErr) {
        console.error("Auto-actions failed (phase was updated):", autoErr);
      }
    }

    // History insert is non-critical: neon-http driver has no transaction support,
    // so if this fails the phase update already succeeded. Log error but don't fail.
    try {
      await db.insert(animalWorkflowHistory).values({
        animalId,
        fromPhase: currentPhase,
        toPhase: nextPhase,
        changedBy: session.userId,
        changeReason: reason ?? null,
        autoActionsTriggered: autoActionsTriggered,
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
    if (autoActionsTriggered) {
      revalidatePath("/beheerder");
    }

    const guardsOverridden = warnings.length > 0 ? true : undefined;
    return { success: true, data: { fromPhase: currentPhase, toPhase: nextPhase, guardsOverridden } };
  } catch {
    return { success: false, error: "Er ging iets mis. Probeer het later opnieuw." };
  }
}
