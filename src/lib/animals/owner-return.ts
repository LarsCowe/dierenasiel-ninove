import { SPECIES_LABELS } from "@/lib/constants";

/**
 * Story 10.64 — het formulier "Terug naar eigenaar" (model van Sven, 5 mei 2026).
 *
 * Pure logica zonder databank: volgnummer, de vertaling van de fiche naar de
 * vakjes op het papier, en de gegevens die de PDF nodig heeft.
 */

export const OWNER_RETURN_NR_PREFIX = "TNE";

/**
 * Volgnummer `TNE-JJJJ-NNNN`, per jaar doorgeteld. `laatste` is het hoogste
 * nummer dat al bestaat (of null); een nummer uit een ander jaar telt niet mee.
 */
export function nextOwnerReturnNr(jaar: number, laatste: string | null): string {
  const m = laatste?.match(/^TNE-(\d{4})-(\d+)$/);
  const volgend = m && Number(m[1]) === jaar ? Number(m[2]) + 1 : 1;
  return `${OWNER_RETURN_NR_PREFIX}-${jaar}-${String(volgend).padStart(4, "0")}`;
}

const MANNELIJK = new Set(["reu", "kater", "mannetje", "mannelijk"]);
const VROUWELIJK = new Set(["teef", "poes", "vrouwtje", "vrouwelijk"]);

/** Sven's formulier kent enkel M en V; onbekend blijft blanco. */
export function genderToMV(gender: string | null | undefined): "M" | "V" | null {
  const g = (gender ?? "").trim().toLowerCase();
  if (MANNELIJK.has(g)) return "M";
  if (VROUWELIJK.has(g)) return "V";
  return null;
}

export interface AnimalForPrefill {
  name: string;
  species: string;
  breed: string | null;
  dateOfBirth: string | null;
  identificationNr: string | null;
  gender: string | null;
  isNeutered: boolean | null;
  passportNr: string | null;
  description: string | null;
}

export interface AnimalSnapshotFields {
  animalName: string;
  animalSpecies: string;
  animalBreed: string;
  animalBirthDate: string;
  animalIdentificationNr: string;
  animalGender: string;
  animalNeutered: string;
  animalPedigree: string;
  animalPassportNr: string;
  animalCoatDescription: string;
}

/**
 * De fiche als vertrekpunt voor het formulier. Alles blijft bewerkbaar
 * (Sven: "gegevens dier zal manueel moeten"); stamboom staat niet op de fiche.
 */
export function prefillFromAnimal(animal: AnimalForPrefill): AnimalSnapshotFields {
  return {
    animalName: animal.name ?? "",
    animalSpecies: animal.species ?? "",
    animalBreed: animal.breed ?? "",
    animalBirthDate: animal.dateOfBirth ?? "",
    animalIdentificationNr: animal.identificationNr ?? "",
    animalGender: genderToMV(animal.gender) ?? "",
    animalNeutered: animal.isNeutered === true ? "ja" : animal.isNeutered === false ? "nee" : "",
    animalPedigree: "",
    animalPassportNr: animal.passportNr ?? "",
    animalCoatDescription: animal.description ?? "",
  };
}

export function ownerFullName(f: { ownerLastName: string; ownerFirstName: string }): string {
  return [f.ownerLastName, f.ownerFirstName].map((s) => s.trim()).filter(Boolean).join(" ");
}

/** JJJJ-MM-DD → DD/MM/JJJJ; wat geen ISO-datum is, blijft zoals het is. */
export function formatBelgianDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export interface OwnerReturnRecordLike {
  formNr: string;
  drawnUpOn: string;
  drawnUpAt: string | null;
  ownerLastName: string;
  ownerFirstName: string;
  ownerStreet: string | null;
  ownerPostalCode: string | null;
  ownerCity: string | null;
  ownerCountry: string | null;
  ownerBirthDate: string | null;
  ownerBirthPlace: string | null;
  ownerPhone: string | null;
  ownerMobile: string | null;
  ownerEmail: string | null;
  animalName: string;
  animalSpecies: string | null;
  animalBreed: string | null;
  animalBirthDate: string | null;
  animalIdentificationNr: string | null;
  animalGender: string | null;
  animalNeutered: string | null;
  animalPedigree: string | null;
  animalPassportNr: string | null;
  animalCoatDescription: string | null;
  stayCosts: string | null;
  totalPaid: string | null;
}

export interface OwnerReturnPdfData {
  formNr: string;
  drawnUpOn: string;
  drawnUpAt: string;
  ownerLastName: string;
  ownerFirstName: string;
  ownerStreet: string;
  ownerPostalCode: string;
  ownerCity: string;
  ownerCountry: string;
  ownerBirthDate: string;
  ownerBirthPlace: string;
  ownerPhone: string;
  ownerMobile: string;
  ownerEmail: string;
  animalName: string;
  speciesLabel: string;
  animalBreed: string;
  animalBirthDate: string;
  animalIdentificationNr: string;
  genderM: boolean;
  genderV: boolean;
  neuteredYes: boolean;
  neuteredNo: boolean;
  pedigreeYes: boolean;
  pedigreeNo: boolean;
  animalPassportNr: string;
  animalCoatDescription: string;
  stayCosts: string;
  totalPaid: string;
}

const tekst = (v: string | null | undefined) => v ?? "";

/** Alles wat de PDF toont, als tekst en vinkjes — geen null meer voorbij dit punt. */
export function buildOwnerReturnPdfData(r: OwnerReturnRecordLike): OwnerReturnPdfData {
  const soort = tekst(r.animalSpecies);
  return {
    formNr: r.formNr,
    drawnUpOn: formatBelgianDate(r.drawnUpOn),
    drawnUpAt: tekst(r.drawnUpAt),
    ownerLastName: r.ownerLastName,
    ownerFirstName: r.ownerFirstName,
    ownerStreet: tekst(r.ownerStreet),
    ownerPostalCode: tekst(r.ownerPostalCode),
    ownerCity: tekst(r.ownerCity),
    ownerCountry: tekst(r.ownerCountry),
    ownerBirthDate: formatBelgianDate(r.ownerBirthDate),
    ownerBirthPlace: tekst(r.ownerBirthPlace),
    ownerPhone: tekst(r.ownerPhone),
    ownerMobile: tekst(r.ownerMobile),
    ownerEmail: tekst(r.ownerEmail),
    animalName: r.animalName,
    speciesLabel: SPECIES_LABELS[soort] ?? soort,
    animalBreed: tekst(r.animalBreed),
    animalBirthDate: formatBelgianDate(r.animalBirthDate),
    animalIdentificationNr: tekst(r.animalIdentificationNr),
    genderM: r.animalGender === "M",
    genderV: r.animalGender === "V",
    neuteredYes: r.animalNeutered === "ja",
    neuteredNo: r.animalNeutered === "nee",
    pedigreeYes: r.animalPedigree === "ja",
    pedigreeNo: r.animalPedigree === "nee",
    animalPassportNr: tekst(r.animalPassportNr),
    animalCoatDescription: tekst(r.animalCoatDescription),
    stayCosts: tekst(r.stayCosts),
    totalPaid: tekst(r.totalPaid),
  };
}
