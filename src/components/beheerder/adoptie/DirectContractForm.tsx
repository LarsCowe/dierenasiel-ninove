"use client";

import { useMemo, useState } from "react";
import AnimalAutocomplete, {
  type AnimalOption,
  type CandidateOption,
} from "./AnimalAutocomplete";
import AdoptionContractForm from "./AdoptionContractForm";

interface Props {
  animals: AnimalOption[];
}

const EMPTY_ADOPTANT = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  dateOfBirth: "",
  rijksregister: "",
};

const EMPTY_ANIMAL = {
  name: "",
  species: "",
  breed: "",
  dateOfBirth: "",
  gender: "",
  color: "",
  identificationNr: "",
  passportNr: "",
  description: "",
  isNeutered: false,
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Nieuw",
  screening: "Screening",
  approved: "Goedgekeurd",
  rejected: "Afgewezen",
  adopted: "Geadopteerd",
};

function pickPreferredCandidate(candidates: CandidateOption[]): CandidateOption | null {
  if (candidates.length === 0) return null;
  // Bij voorkeur de meest recent goedgekeurde kandidaat.
  const approved = candidates.find((c) => c.status === "approved");
  return approved ?? candidates[0];
}

function candidateToAdoptant(c: CandidateOption) {
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    address: c.address,
    dateOfBirth: c.dateOfBirth,
    rijksregister: c.rijksregister,
  };
}

export default function DirectContractForm({ animals }: Props) {
  const [selected, setSelected] = useState<AnimalOption | null>(null);
  // Welke kandidaat is overgenomen voor dit dier (id of null voor "leeg/handmatig").
  const [candidateId, setCandidateId] = useState<number | null>(null);

  function handleSelectAnimal(animal: AnimalOption) {
    setSelected(animal);
    const preferred = pickPreferredCandidate(animal.candidates);
    setCandidateId(preferred?.id ?? null);
  }

  const adoptantPrefill = useMemo(() => {
    if (!selected) return EMPTY_ADOPTANT;
    if (candidateId === null) return EMPTY_ADOPTANT;
    const c = selected.candidates.find((c) => c.id === candidateId);
    return c ? candidateToAdoptant(c) : EMPTY_ADOPTANT;
  }, [selected, candidateId]);

  const animalForForm = selected
    ? {
        name: selected.name,
        species: selected.species,
        breed: selected.breed,
        dateOfBirth: selected.birthDate,
        gender: selected.gender,
        color: selected.color,
        identificationNr: selected.identificationNr,
        passportNr: selected.passportNr,
        description: selected.description,
        isNeutered: selected.isNeutered,
      }
    : EMPTY_ANIMAL;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Kies het dier</h2>
        <p className="mt-1 text-xs text-gray-500">
          Type een naam, ras of chipnummer om te zoeken. Bestaande adoptie-aanvragen voor dit dier worden automatisch overgenomen.
        </p>
        <div className="mt-3">
          <AnimalAutocomplete animals={animals} onSelect={handleSelectAnimal} selected={selected} />
        </div>

        {selected && selected.candidates.length > 0 && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-900">
              {selected.candidates.length === 1
                ? "Eén bestaande aanvraag gevonden voor dit dier — adoptant-gegevens zijn automatisch overgenomen."
                : `${selected.candidates.length} aanvragen gevonden voor dit dier — kies welke adoptant je wil overnemen:`}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selected.candidates.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCandidateId(c.id)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                    candidateId === c.id
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  {c.firstName} {c.lastName}
                  <span className="ml-1 text-[10px] opacity-75">
                    ({STATUS_LABEL[c.status] ?? c.status})
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCandidateId(null)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                  candidateId === null
                    ? "border-gray-700 bg-gray-700 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Leeg / handmatig
              </button>
            </div>
          </div>
        )}
        {selected && selected.candidates.length === 0 && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Geen bestaande aanvraag gevonden voor dit dier — vul de adoptant-gegevens manueel in.
          </p>
        )}
      </div>

      {selected ? (
        <AdoptionContractForm
          // Story 10.20+: key forceert remount bij wijzigen van dier of kandidaat zodat
          // de useState pre-fill correct opnieuw geïnitialiseerd wordt.
          key={`${selected.id}-${candidateId ?? "manual"}`}
          candidateId={candidateId}
          animalId={selected.id}
          adoptant={adoptantPrefill}
          animal={animalForForm}
          onSuccessRedirect="/beheerder/adoptie?tab=contracten"
        />
      ) : (
        <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          Kies eerst een dier om verder te gaan.
        </p>
      )}
    </div>
  );
}
