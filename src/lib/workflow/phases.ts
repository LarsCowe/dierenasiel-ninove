export const WORKFLOW_PHASES = [
  "intake",
  "registratie",
  "medisch",
  "verblijf",
  "adoptie",
  "afgerond",
] as const;

export type WorkflowPhase = (typeof WORKFLOW_PHASES)[number];

export function getNextPhase(current: WorkflowPhase): WorkflowPhase | null {
  const index = WORKFLOW_PHASES.indexOf(current);
  if (index === -1 || index === WORKFLOW_PHASES.length - 1) return null;
  return WORKFLOW_PHASES[index + 1];
}

export function isValidTransition(
  from: WorkflowPhase,
  to: WorkflowPhase,
): boolean {
  const nextPhase = getNextPhase(from);
  return nextPhase === to;
}
