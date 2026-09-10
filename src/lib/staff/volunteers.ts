/**
 * Story 14.4 — vrijwilligers zijn wandelaars (Sven, vraag 1: "ja dat kan").
 *
 * Een goedgekeurde wandelaar heeft een account met rol `wandelaar`; de leiding kiest die
 * uit een lijst in plaats van een losse naam te typen. Wie geen wandelaar is, blijft een
 * vrijwilliger zonder account, op naam.
 *
 * Pure logica, geen database.
 */

export interface VolunteerOption {
  /** Het account van de wandelaar — daarmee wordt hij ingeschreven. */
  userId: number;
  name: string;
}

export type PersonLabel = "wandelaar" | "vrijwilliger" | null;

/** Wat er tussen haakjes achter de naam komt. Medewerkers en de leiding krijgen niets. */
export function personLabel(entry: { userId: number | null; userRole: string | null }): PersonLabel {
  if (entry.userId === null) return "vrijwilliger";
  if (entry.userRole === "wandelaar") return "wandelaar";
  return null;
}

/**
 * Op naam, en elk account maar één keer. Twee wandelaarsrecords kunnen naar hetzelfde
 * account wijzen — wie zich opnieuw registreert met hetzelfde e-mailadres, krijgt bij het
 * goedkeuren zijn bestaande account terug (code-review 14.4).
 */
export function sortVolunteers(opties: readonly VolunteerOption[]): VolunteerOption[] {
  const uniek = new Map<number, VolunteerOption>();
  for (const optie of opties) {
    if (!uniek.has(optie.userId)) uniek.set(optie.userId, optie);
  }
  return [...uniek.values()].sort((a, b) => a.name.localeCompare(b.name, "nl", { sensitivity: "base" }));
}
