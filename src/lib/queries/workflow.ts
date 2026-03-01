import { db } from "@/lib/db";
import { animalWorkflowHistory, animals, users, vaccinations, adoptionContracts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { AnimalWorkflowHistory, WorkflowHistoryEntry } from "@/types";
import type { GuardContext } from "@/lib/workflow/guards";

export async function getWorkflowHistoryWithUserByAnimalId(animalId: number): Promise<WorkflowHistoryEntry[]> {
  try {
    return await db
      .select({
        id: animalWorkflowHistory.id,
        animalId: animalWorkflowHistory.animalId,
        fromPhase: animalWorkflowHistory.fromPhase,
        toPhase: animalWorkflowHistory.toPhase,
        changedBy: animalWorkflowHistory.changedBy,
        changeReason: animalWorkflowHistory.changeReason,
        autoActionsTriggered: animalWorkflowHistory.autoActionsTriggered,
        createdAt: animalWorkflowHistory.createdAt,
        changedByName: users.name,
      })
      .from(animalWorkflowHistory)
      .leftJoin(users, eq(animalWorkflowHistory.changedBy, users.id))
      .where(eq(animalWorkflowHistory.animalId, animalId))
      .orderBy(desc(animalWorkflowHistory.createdAt));
  } catch (err) {
    console.error("getWorkflowHistoryWithUserByAnimalId query failed:", err);
    return [];
  }
}

export async function getWorkflowHistoryByAnimalId(animalId: number): Promise<AnimalWorkflowHistory[]> {
  try {
    return await db
      .select()
      .from(animalWorkflowHistory)
      .where(eq(animalWorkflowHistory.animalId, animalId))
      .orderBy(desc(animalWorkflowHistory.createdAt));
  } catch (err) {
    console.error("getWorkflowHistoryByAnimalId query failed:", err);
    return [];
  }
}

export async function getCurrentPhase(animalId: number): Promise<string | null> {
  try {
    const results = await db
      .select({ workflowPhase: animals.workflowPhase })
      .from(animals)
      .where(eq(animals.id, animalId))
      .limit(1);

    if (results.length === 0) return null;
    return results[0].workflowPhase;
  } catch (err) {
    console.error("getCurrentPhase query failed:", err);
    return null;
  }
}

export async function getAnimalGuardContext(animalId: number): Promise<GuardContext | null> {
  try {
    const animalResults = await db
      .select({
        id: animals.id,
        species: animals.species,
        identificationNr: animals.identificationNr,
        isNeutered: animals.isNeutered,
      })
      .from(animals)
      .where(eq(animals.id, animalId))
      .limit(1);

    if (animalResults.length === 0) return null;

    const vaccinationResults = await db
      .select({ id: vaccinations.id })
      .from(vaccinations)
      .where(eq(vaccinations.animalId, animalId))
      .limit(1);

    const contractResults = await db
      .select({ id: adoptionContracts.id })
      .from(adoptionContracts)
      .where(eq(adoptionContracts.animalId, animalId))
      .limit(1);

    const animal = animalResults[0];
    return {
      animal: {
        id: animal.id,
        species: animal.species,
        identificationNr: animal.identificationNr,
        isNeutered: animal.isNeutered ?? false,
      },
      hasVaccinations: vaccinationResults.length > 0,
      hasAdoptionContract: contractResults.length > 0,
    };
  } catch (err) {
    console.error("getAnimalGuardContext query failed:", err);
    return null;
  }
}
