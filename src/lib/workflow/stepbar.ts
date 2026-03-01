import { WORKFLOW_PHASES, type WorkflowPhase } from "./phases";
import type { AnimalTodo } from "@/types";

export type PhaseStatus = "completed" | "active" | "future";

/**
 * Determine the visual status of a target phase relative to the current phase.
 * Returns 'completed' if before current, 'active' if equal, 'future' if after.
 */
export function getPhaseStatus(
  currentPhase: string,
  targetPhase: string,
): PhaseStatus {
  const currentIndex = WORKFLOW_PHASES.indexOf(currentPhase as WorkflowPhase);
  const targetIndex = WORKFLOW_PHASES.indexOf(targetPhase as WorkflowPhase);

  // Unknown phases default to future
  if (currentIndex === -1 || targetIndex === -1) return "future";

  if (targetIndex < currentIndex) return "completed";
  if (targetIndex === currentIndex) return "active";
  return "future";
}

export const PHASE_LABELS: Record<string, string> = {
  intake: "Intake",
  registratie: "Registratie",
  medisch: "Medisch",
  verblijf: "Verblijf",
  adoptie: "Adoptie",
  afgerond: "Afgerond",
};

/**
 * Group open (not completed) todos by their workflowPhase.
 * Todos without a workflowPhase are excluded.
 */
export function groupOpenTodosByPhase(
  todos: AnimalTodo[],
): Record<string, AnimalTodo[]> {
  const grouped: Record<string, AnimalTodo[]> = {};

  for (const todo of todos) {
    if (todo.isCompleted || !todo.workflowPhase) continue;
    if (!grouped[todo.workflowPhase]) {
      grouped[todo.workflowPhase] = [];
    }
    grouped[todo.workflowPhase].push(todo);
  }

  return grouped;
}
