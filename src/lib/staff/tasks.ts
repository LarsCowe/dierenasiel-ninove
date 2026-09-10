/**
 * Story 14.2 — een taak bij een aanwezigheid.
 *
 * Sven, vraag 7 (2026-09-10): vaste lijst of vrije tekst? *"beide zouden goed zijn, er zijn
 * repetitieve taken maar ook occasionele"*. Dus vrije tekst met voorstellen, zoals de posten
 * bij de evenementenshiften (13.6). Wat eerder werd ingevuld, komt mee in de voorstellen:
 * zo groeit de lijst vanzelf naar wat het asiel echt doet, zonder instellingenscherm.
 *
 * Pure logica, geen database.
 */

/** Kolombreedte van `staff_attendance.task`. */
export const TASK_MAX_LENGTH = 120;

/**
 * Svens voorbeelden (2026-08-10): "zwerfkat ophalen, dier naar dierenarts brengen, haag
 * snoeien" en uit zijn plaatsjes-voorbeeld "kuis honden, kuis katten, opruim zolder" —
 * aangevuld met het dagelijkse werk rond de dieren.
 */
export const STAFF_TASK_SUGGESTIONS: readonly string[] = [
  "Kuis honden",
  "Kuis katten",
  "Voederen",
  "Wandelen met de honden",
  "Zwerfkat ophalen",
  "Dier naar de dierenarts brengen",
  "Haag snoeien",
  "Opruim zolder",
] as const;

/** Spaties opkuisen; een lege taak is geen taak. */
export function normalizeTask(input: string | null | undefined): string | null {
  const taak = (input ?? "").replace(/\s+/g, " ").trim();
  return taak === "" ? null : taak;
}

function sleutel(taak: string): string {
  return taak.toLocaleLowerCase("nl");
}

/**
 * De vaste voorstellen eerst, in hun eigen volgorde; daarna wat eerder werd ingevuld en er
 * nog niet bij staat, alfabetisch. Hoofdletters en spaties maken geen verschil.
 */
export function taskSuggestions(eerder: readonly (string | null)[]): string[] {
  const gezien = new Set(STAFF_TASK_SUGGESTIONS.map(sleutel));
  const extra: string[] = [];
  for (const ruw of eerder) {
    const taak = normalizeTask(ruw);
    if (!taak || gezien.has(sleutel(taak))) continue;
    gezien.add(sleutel(taak));
    extra.push(taak);
  }
  extra.sort((a, b) => a.localeCompare(b, "nl", { sensitivity: "base" }));
  return [...STAFF_TASK_SUGGESTIONS, ...extra];
}
