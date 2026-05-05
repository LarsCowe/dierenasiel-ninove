import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdoptionCandidateById } from "@/lib/queries/adoption-candidates";
import { getAnimalById } from "@/lib/queries/animals";
import AdoptionContractForm from "@/components/beheerder/adoptie/AdoptionContractForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ContractPage({ params }: Props) {
  const { id } = await params;
  const candidateId = parseInt(id, 10);

  if (isNaN(candidateId)) notFound();

  const candidate = await getAdoptionCandidateById(candidateId);
  if (!candidate) notFound();
  // Contract page accessible regardless of candidate status

  if (!candidate.animalId) notFound();
  const animal = await getAnimalById(candidate.animalId);
  if (!animal) notFound();

  const qa = (candidate.questionnaireAnswers ?? {}) as Record<string, unknown>;
  const speciesLabel = animal.species === "hond" ? "hond" : animal.species === "kat" ? "kat" : "ander dier";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link
          href={`/beheerder/adoptie/${candidate.id}`}
          className="text-sm text-emerald-700 hover:text-emerald-900"
        >
          &larr; Terug naar kandidaat
        </Link>
      </div>

      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
        Adoptiecontract — {speciesLabel}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {candidate.firstName} {candidate.lastName} adopteert {animal.name}
      </p>

      <div className="mt-6">
        <AdoptionContractForm
          candidateId={candidate.id}
          animalId={animal.id}
          adoptant={{
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
            phone: candidate.phone ?? "",
            address: candidate.address ?? "",
            dateOfBirth: typeof qa.geboortedatum === "string" ? qa.geboortedatum : "",
            rijksregister: typeof qa.rijksregister === "string" ? qa.rijksregister : "",
          }}
          animal={{
            name: animal.name,
            species: animal.species,
            breed: animal.breed ?? "",
            dateOfBirth: animal.dateOfBirth ?? "",
            gender: animal.gender ?? "",
            color: animal.color ?? "",
            identificationNr: animal.identificationNr ?? "",
            passportNr: animal.passportNr ?? "",
            description: animal.description ?? "",
            isNeutered: animal.isNeutered ?? false,
          }}
          onSuccessRedirect={`/beheerder/adoptie/${candidate.id}`}
        />
      </div>
    </div>
  );
}
