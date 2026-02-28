export interface GuardWarning {
  code: string;
  message: string;
  field: string;
}

export interface GuardContext {
  animal: {
    id: number;
    species: string;
    identificationNr: string | null;
    isNeutered: boolean;
  };
  hasVaccinations: boolean;
  hasAdoptionContract: boolean;
}

export type TransitionGuardFn = (ctx: GuardContext) => GuardWarning[];

// --- Individual guard functions ---

function catChipGuard(ctx: GuardContext): GuardWarning[] {
  if (ctx.animal.species !== "kat") return [];
  if (!ctx.animal.identificationNr) {
    return [{
      code: "cat_chip_missing",
      message: "Chip/identificatienummer ontbreekt (wettelijk verplicht voor katten)",
      field: "identificationNr",
    }];
  }
  return [];
}

function catVaccinationGuard(ctx: GuardContext): GuardWarning[] {
  if (ctx.animal.species !== "kat") return [];
  if (!ctx.hasVaccinations) {
    return [{
      code: "cat_vaccination_missing",
      message: "Vaccinatie ontbreekt (wettelijk verplicht voor katten)",
      field: "vaccinations",
    }];
  }
  return [];
}

function catNeuteringGuard(ctx: GuardContext): GuardWarning[] {
  if (ctx.animal.species !== "kat") return [];
  if (!ctx.animal.isNeutered) {
    return [{
      code: "cat_neutering_missing",
      message: "Sterilisatie ontbreekt (wettelijk verplicht voor katten)",
      field: "isNeutered",
    }];
  }
  return [];
}

function identificationGuard(ctx: GuardContext): GuardWarning[] {
  if (!ctx.animal.identificationNr) {
    return [{
      code: "identification_missing",
      message: "Chip/identificatienummer ontbreekt",
      field: "identificationNr",
    }];
  }
  return [];
}

function adoptionContractGuard(ctx: GuardContext): GuardWarning[] {
  if (!ctx.hasAdoptionContract) {
    return [{
      code: "adoption_contract_missing",
      message: "Adoptiecontract ontbreekt",
      field: "adoptionContract",
    }];
  }
  return [];
}

// --- Shared guard lists ---

const CAT_OUTGOING_GUARDS: TransitionGuardFn[] = [catChipGuard, catVaccinationGuard, catNeuteringGuard];

// --- Guard registry: map "from→to" to guard functions ---

const TRANSITION_GUARDS: Record<string, TransitionGuardFn[]> = {
  "medisch→verblijf": [identificationGuard],
  "verblijf→adoptie": CAT_OUTGOING_GUARDS,
  "adoptie→afgerond": [adoptionContractGuard],
};

/**
 * Evaluate all guards for a given phase transition.
 * Returns an array of warnings (empty = no issues).
 */
export function evaluateGuards(
  fromPhase: string,
  toPhase: string,
  context: GuardContext,
): GuardWarning[] {
  const key = `${fromPhase}→${toPhase}`;
  const guards = TRANSITION_GUARDS[key];
  if (!guards) return [];

  const warnings: GuardWarning[] = [];
  for (const guard of guards) {
    warnings.push(...guard(context));
  }
  return warnings;
}

/**
 * Reusable helper for AC2: evaluate cat outgoing guards
 * (chip + vaccination + neutering) independent of workflow transition.
 * Used by both workflow transitions and outtake flow.
 */
export function evaluateCatOutgoingGuards(context: GuardContext): GuardWarning[] {
  const warnings: GuardWarning[] = [];
  for (const guard of CAT_OUTGOING_GUARDS) {
    warnings.push(...guard(context));
  }
  return warnings;
}
