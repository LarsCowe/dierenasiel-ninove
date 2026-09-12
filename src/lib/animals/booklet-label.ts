/**
 * Story 10.66 — het etiket dat bij adoptie achteraan in het boekje komt.
 *
 * Sven: "bij adoptie schrijven wij altijd achteraan in boekje welke
 * ontwormingen er gegeven werden en of het dier bij ons steriel gemaakt werd".
 * Die gegevens houden we al bij; dit etiket vervangt het overschrijven.
 *
 * Pure functie: hier wordt alleen bepaald wát er op het etiket komt. Het tekenen
 * gebeurt in `BookletLabelPdf`.
 */

export interface BookletLabelInput {
  animal: {
    name: string;
    identificationNr: string | null;
    isNeutered: boolean | null;
    neuteredByShelter: boolean | null;
    neuteredDate: string | null;
  };
  /** Rijen uit `dewormings` — ook vlooienbehandelingen, die hier wegvallen. */
  dewormings: { date: string; type: string; category: string }[];
}

export interface BookletLabelModel {
  naam: string;
  chip: string;
  /** Leeg = onbekend: blijft open om met de hand in te vullen. */
  steriel: string;
  /** Van oud naar nieuw. */
  ontwormingen: { datum: string; product: string }[];
}

/** `"2026-05-12"` → `"12/05/2026"`. */
function datum(waarde: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((waarde ?? "").trim());
  if (!match) return "";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function tekst(waarde: string | null | undefined): string {
  return (waarde ?? "").trim();
}

function steriel({ isNeutered, neuteredByShelter, neuteredDate }: BookletLabelInput["animal"]): string {
  if (isNeutered === false) return "Neen";
  if (isNeutered !== true) return "";
  if (neuteredByShelter === true) {
    const op = datum(neuteredDate);
    return op ? `Ja, door het asiel op ${op}` : "Ja, door het asiel";
  }
  if (neuteredByShelter === false) return "Ja (niet door het asiel)";
  return "Ja";
}

export function buildBookletLabel({ animal, dewormings }: BookletLabelInput): BookletLabelModel {
  const ontwormingen = dewormings
    .filter((rij) => rij.category === "ontworming")
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((rij) => ({ datum: datum(rij.date), product: tekst(rij.type) }));

  return {
    naam: tekst(animal.name),
    chip: tekst(animal.identificationNr),
    steriel: steriel(animal),
    ontwormingen,
  };
}
