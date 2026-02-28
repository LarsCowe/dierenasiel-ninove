import { getAnimalsAvailableForAdoption } from "@/lib/queries/animals";
import AdoptionCandidateForm from "@/components/beheerder/adoptie/AdoptionCandidateForm";

export default async function NieuweAdoptieAanvraagPage() {
  const animals = await getAnimalsAvailableForAdoption();

  const availableAnimals = animals.map((a) => ({
    id: a.id,
    name: a.name,
    species: a.species,
    identificationNr: a.identificationNr,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
        Nieuwe adoptie-aanvraag
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Registreer een kandidaat-adoptant met de verplichte vragenlijst (Bijlage IX).
      </p>

      <div className="mt-6">
        <AdoptionCandidateForm availableAnimals={availableAnimals} />
      </div>
    </div>
  );
}
